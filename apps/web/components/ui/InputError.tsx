export default function InputError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div>
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}
