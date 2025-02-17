import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export const Portal = ({ children }) => {
  const portalRoot = useRef(
    document.getElementById('portal-root') || (() => {
      const div = document.createElement('div');
      div.id = 'portal-root';
      document.body.appendChild(div);
      return div;
    })()
  );

  useEffect(() => {
    return () => {
      // 如果是我们创建的 portal-root，在组件卸载时移除它
      if (portalRoot.current && portalRoot.current.childNodes.length === 0) {
        document.body.removeChild(portalRoot.current);
      }
    };
  }, []);

  return createPortal(children, portalRoot.current);
}; 