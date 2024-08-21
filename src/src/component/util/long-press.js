import { useEffect } from 'react';

function dist2(x1, y1, x2, y2) {
   const dx = x2 - x1;
   const dy = y2 - y1;
   return dy * dy + dx * dx;
}

export default function useLongPress(ref, opt) {
   opt = opt || {};
   opt.ms = opt.ms || 600; // hold N ms -> long press
   opt.holdMove = 3 * 3; // hold and move less than 3px -> long press
   const stat = {
      x: -1, y: -1, down: false, ts: -1,
      onLongPress: null,
      onClick: null,
   };
   const cancel = () => {
      stat.down = false;
      if (stat.timer) {
         clearTimeout(stat.timer);
         stat.timer = 0;
      }
   };
   const onMouseDown = (evt) => {
      stat.x = evt.offsetX;
      stat.y = evt.offsetY;
      stat.ts = new Date().getTime();
      stat.down = true;
      stat.acted = false;
      stat.timer = setTimeout(() => {
         stat.timer = 0;
         if (stat.acted) return;
         stat.acted = true;
         stat.onLongPress && stat.onLongPress(evt);
      }, opt.ms);
   };
   const onMouseMove = (evt) => {
      if (!stat.down) return;
      const d = dist2(stat.x, stat.y, evt.offsetX, evt.offsetY);
      if (d > opt.holdMove) return cancel();
   };
   const onMouseUp = (evt) => {
      if (!stat.down) return;
      const acted = stat.acted;
      cancel(); // did cancel before run outer function in case error occurs
      if (!acted) {
         stat.acted = true;
         stat.onClick && stat.onClick(evt);
      }
   };
   const onMouseLeave = (evt) => {
      cancel();
   };
   const onTouchDown = (evt) => {
      stat.x = null;
      stat.y = null;
      stat.ts = new Date().getTime();
      stat.down = true;
      stat.acted = false;
      stat.timer = setTimeout(() => {
         stat.timer = 0;
         if (stat.acted) return;
         stat.acted = true;
         stat.onLongPress && stat.onLongPress(evt);
      }, opt.ms);
   };
   const onTouchMove = (evt) => {
      if (!stat.down) return;
      const t = evt.touches[0];
      if (!t) return cancel();
      if (stat.x === null) {
         stat.x = t.clientX;
         stat.y = t.clientY;
      } else {
         const d = dist2(stat.x, stat.y, t.clientX, t.clientY);
         if (d > opt.holdMove) return cancel();
      }
   };
   const onTouchUp = (evt) => {
      if (!stat.down) return;
      const acted = stat.acted;
      cancel(); // did cancel before run outer function in case error occurs
      if (!acted) {
         stat.acted = true;
         stat.onClick && stat.onClick(evt);
      }
   };
   useEffect(() => {
      if (ref.current) {
         ref.current.addEventListener('mousedown', onMouseDown);
         ref.current.addEventListener('mousemove', onMouseMove);
         ref.current.addEventListener('mouseup', onMouseUp);
         ref.current.addEventListener('mouseleave', onMouseLeave);
         ref.current.addEventListener('touchstart', onTouchDown);
         ref.current.addEventListener('touchmove', onTouchMove);
         ref.current.addEventListener('touchend', onTouchUp);
      }
      return () => {
         if (ref.current) {
            ref.current.removeEventListener('mousedown', onMouseDown);
            ref.current.removeEventListener('mousemove', onMouseMove);
            ref.current.removeEventListener('mouseup', onMouseUp);
            ref.current.removeEventListener('mouseleave', onMouseLeave);
            ref.current.removeEventListener('touchstart', onTouchDown);
            ref.current.removeEventListener('touchmove', onTouchMove);
            ref.current.removeEventListener('touchend', onTouchUp);
         }
      };
   });

   return function on(onClick, onLongPress) {
      stat.onClick = onClick;
      stat.onLongPress = onLongPress;
   }
}