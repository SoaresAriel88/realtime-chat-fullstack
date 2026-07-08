type AvatarProps = {
  name: string;
  status?: 'online' | 'offline' | 'away';
};

export function Avatar({ name, status }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="avatar-wrapper">
      <div className="avatar">{initials}</div>
      {status && <span className={`status-dot ${status}`} />}
    </div>
  );
}
