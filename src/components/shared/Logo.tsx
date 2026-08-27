import React from "react";

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <div className={`${className} flex-shrink-0 flex items-center justify-center`}>
      <img
        src="/logoo.png"
        alt="Business Creator Logo"
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default Logo;
