'use client';

interface Props {
  svg?: string;
  imagePath?: string;
  className?: string;
  flipped?: boolean;
  alt?: string;
}

export function TreeIllustration({ svg, imagePath, className, flipped, alt = '' }: Props) {
  const style: React.CSSProperties = {
    transform: flipped ? 'scaleX(-1)' : undefined,
  };

  if (imagePath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imagePath}
        alt={alt}
        className={className}
        style={{
          ...style,
          objectFit: 'contain',
          objectPosition: 'center bottom',
          display: 'block',
          width: '100%',
          height: '100%',
        }}
        draggable={false}
      />
    );
  }

  return (
    <div className={className} style={style} dangerouslySetInnerHTML={{ __html: svg ?? '' }} />
  );
}
