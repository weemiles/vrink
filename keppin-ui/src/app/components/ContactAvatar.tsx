interface ContactAvatarProps {
  name: string;
  color: string;
  size?: number;
}

export function ContactAvatar({ name, color, size = 44 }: ContactAvatarProps) {
  const initial = name.charAt(0);
  const fontSize = size * 0.4;

  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color + '18',
      }}
      role="img"
      aria-label={`${name} 아바타`}
    >
      <span style={{ fontSize, fontWeight: 700, color }} aria-hidden="true">{initial}</span>
    </div>
  );
}
