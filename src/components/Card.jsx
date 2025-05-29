import React from 'react';
import { STYLES } from '../constants';

const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  selected = false, 
  clickable = false,
  onClick,
  ...props 
}) => {
  const baseClasses = STYLES.card.base;
  const hoverClasses = (hover || clickable) ? STYLES.card.hover : '';
  const selectedClasses = selected ? STYLES.card.selected : '';
  const cursorClass = clickable ? 'cursor-pointer' : '';
  
  const combinedClasses = [
    baseClasses,
    hoverClasses,
    selectedClasses,
    cursorClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={combinedClasses}
      onClick={clickable ? onClick : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;