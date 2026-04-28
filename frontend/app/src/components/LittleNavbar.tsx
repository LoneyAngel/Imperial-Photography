import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LittleNavbar() {
  const [navbarClicked, setNavbarClicked] = useState(
    localStorage.getItem('navbarClicked') === 'true'
  );

  useEffect(() => {
    if (!navbarClicked) {
      const timer = setTimeout(() => {
        localStorage.setItem('navbarClicked', 'true');
        setNavbarClicked(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [navbarClicked]);

  function handleClick() {
    localStorage.setItem('navbarClicked', 'true');
    setNavbarClicked(true);
  }

  return (
    <AnimatePresence>
      {!navbarClicked && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="h-[50px] flex items-center justify-center bg-slate-300 relative"
        >
          <p className="text-center text-sm underline decoration-sky-500 decoration-2 underline-offset-4 decoration-dashed">
            Welcome to join us and become our exclusive photographer！
          </p>
          <button onClick={handleClick} className="absolute right-4">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
