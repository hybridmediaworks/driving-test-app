<?php

namespace App\Support\DisposableEmail;

use Closure;
use Illuminate\Support\Str;

class DisposableMailServers
{
    /** @var list<string>|null */
    private ?array $ips = null;

    private ?Closure $resolver = null;

    public function __construct(private readonly string $storagePath) {}

    public function isDisposable(string $email): bool
    {
        $domain = Str::lower(Str::after($email, '@'));

        if ($domain === '' || ! str_contains($email, '@') || $this->ips() === []) {
            return false;
        }

        $serverIps = array_merge(...array_values($this->mailServers($domain)));

        return array_intersect($serverIps, $this->ips()) !== [];
    }

    /**
     * @return array<string, list<string>> MX host => its IPv4 addresses
     */
    public function mailServers(string $domain): array
    {
        if ($this->resolver !== null) {
            return ($this->resolver)($domain);
        }

        $servers = [];

        foreach (@dns_get_record($domain, DNS_MX) ?: [] as $record) {
            $host = Str::lower(rtrim((string) ($record['target'] ?? ''), '.'));

            if ($host !== '') {
                $servers[$host] = @gethostbynamel($host) ?: [];
            }
        }

        return $servers;
    }

    /**
     * @return list<string>
     */
    public function ips(): array
    {
        if ($this->ips !== null) {
            return $this->ips;
        }

        $stored = is_file($this->storagePath) ? json_decode((string) file_get_contents($this->storagePath), true) : null;

        return $this->ips = is_array($stored) ? array_values($stored) : [];
    }

    /**
     * @param  list<string>  $ips
     */
    public function save(array $ips): void
    {
        $this->ips = array_values(array_unique($ips));

        file_put_contents($this->storagePath, json_encode($this->ips));
    }

    public function setResolver(?Closure $resolver): void
    {
        $this->resolver = $resolver;
    }
}
