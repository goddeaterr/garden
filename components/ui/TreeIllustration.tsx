'use client';

interface Props {
  svg?: string;
  imagePath?: string;
  className?: string;
  flipped?: boolean;
  alt?: string;
}

export function TreeIllustration({ svg, imagePath, className, flipped, alt = '' }: Props) {
  const flip: React.CSSProperties = flipped ? { transform: 'scaleX(-1)' } : {};

  if (imagePath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imagePath}
        alt={alt}
        className={className}
        draggable={false}
        loading="lazy"
        decoding="async"
        style={{
          ...flip,
          objectFit: 'contain',
          objectPosition: 'center bottom',
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    );
  }

  return (
    <div className={className} style={flip} dangerouslySetInnerHTML={{ __html: svg ?? '' }} />
  );
}
