<?php

namespace App\Console\Commands;

use App\Support\DisposableEmail\DisposableMailServers;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class UpdateDisposableMailServers extends Command
{
    protected $signature = 'disposable:update-mail-servers';

    protected $description = 'Learn the mail-server IPs shared by recently seen disposable email domains, so brand-new rotating domains on the same servers are blocked before any domain list catches up.';

    private const SOURCE = 'https://raw.githubusercontent.com/7c/fakefilter/main/json/data.json';

    private const RECENT_DAYS = 30;

    private const MIN_DOMAINS_PER_IP = 3;

    private const SHARED_PROVIDER_SUFFIXES = [
        'google.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'microsoft.com', 'yahoodns.net',
        'icloud.com', 'me.com', 'cloudflare.net', 'zoho.com', 'zoho.eu', 'zohomail.com', 'protonmail.ch',
        'proton.me', 'messagingengine.com', 'mailgun.org', 'sendgrid.net', 'amazonaws.com', 'improvmx.com',
        'forwardemail.net', 'yandex.net', 'yandex.ru', 'mail.ru', 'gmx.net', 'gmx.com', 'web.de',
        'mimecast.com', 'pphosted.com', 'secureserver.net', 'emailsrvr.com', 'registrar-servers.com',
        'hostinger.com', 'titan.email', 'migadu.com', 'mxrouting.net', 'qq.com', '163.com', 'naver.com',
    ];

    public function handle(DisposableMailServers $mailServers): int
    {
        $cutoff = now()->subDays(self::RECENT_DAYS)->getTimestamp();

        $domains = collect(Http::timeout(60)->get(self::SOURCE)->throw()->json('domains', []))
            ->filter(fn (array $entry): bool => ($entry['lastseen'] ?? 0) >= $cutoff)
            ->keys();

        $domainsPerIp = [];
        $hostsPerIp = [];

        $this->withProgressBar($domains, function (string $domain) use ($mailServers, &$domainsPerIp, &$hostsPerIp): void {
            foreach ($mailServers->mailServers($domain) as $host => $ips) {
                if (Str::endsWith($host, self::SHARED_PROVIDER_SUFFIXES)) {
                    continue;
                }

                foreach ($ips as $ip) {
                    $domainsPerIp[$ip][$domain] = true;
                    $hostsPerIp[$ip] ??= $host;
                }
            }
        });
        $this->newLine();

        $disposableIps = collect($domainsPerIp)
            ->map(fn (array $seen): int => count($seen))
            ->filter(fn (int $count): bool => $count >= self::MIN_DOMAINS_PER_IP)
            ->sortDesc();

        if ($disposableIps->isEmpty()) {
            $this->error('No shared disposable mail servers found — keeping the previous list.');

            return self::FAILURE;
        }

        $mailServers->save($disposableIps->keys()->all());

        $this->table(
            ['IP', 'Disposable domains', 'Example MX host'],
            $disposableIps->map(fn (int $count, string $ip): array => [$ip, $count, $hostsPerIp[$ip]])->values()->all(),
        );
        $this->info("Saved {$disposableIps->count()} disposable mail-server IPs from {$domains->count()} recent domains.");

        return self::SUCCESS;
    }
}
