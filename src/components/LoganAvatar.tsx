'use client';

import { useState } from 'react';

interface LoganAvatarProps {
  /** Sizing and border classes for the circular frame, e.g. "w-8 h-8 border". */
  className?: string;
  /** Background and text sizing for the monogram shown when the photo fails. */
  fallbackClassName?: string;
}

/**
 * Logan's profile photo, with a monogram fallback.
 *
 * All three places this appears hand-rolled the same <img> plus an onError
 * handler that reached into `nextElementSibling` and toggled a class on a
 * sibling that carried both `hidden` and `flex`. They had drifted apart: the
 * alt text differed between copies, and only some set a shrink guard. One
 * component keeps the shape, the fallback and the semantics consistent.
 *
 * The image is decorative: every call site renders the name "Logan" as text
 * right next to it, so alt text here would just make a screen reader say the
 * name twice.
 */
export default function LoganAvatar({
  className = 'w-10 h-10',
  fallbackClassName = 'bg-gray-600 text-lg',
}: LoganAvatarProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`rounded-full overflow-hidden shrink-0 ${className}`}>
      {failed ? (
        <div
          aria-hidden="true"
          className={`w-full h-full flex items-center justify-center font-bold text-white ${fallbackClassName}`}
        >
          L
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src="/logan-profile.jpg"
          alt=""
          className="w-full h-full object-cover"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
