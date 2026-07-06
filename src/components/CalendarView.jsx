import React, { useState } from 'react';
import './CalendarView.css';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const getPlatformIcon = (platform) => {
  const p = platform.toLowerCase();
  if (p === 'instagram') return <i className="bi bi-instagram" style={{ color: '#E1306C' }}></i>;
  if (p === 'facebook') return <i className="bi bi-facebook" style={{ color: '#1877F2' }}></i>;
  if (p === 'ambos') return <i className="bi bi-arrow-repeat" style={{ color: '#10B981' }}></i>;
  return <i className="bi bi-phone"></i>;
};

const CalendarView = ({ posts, onPreview }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
    return {
      day: daysInPrevMonth - firstDayOfMonth + i + 1,
      isCurrentMonth: false,
      date: new Date(year, month - 1, daysInPrevMonth - firstDayOfMonth + i + 1)
    };
  });

  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
    return {
      day: i + 1,
      isCurrentMonth: true,
      date: new Date(year, month, i + 1)
    };
  });

  const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalDaysSoFar % 7 === 0 ? 0 : 7 - (totalDaysSoFar % 7);
  const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => {
    return {
      day: i + 1,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i + 1)
    };
  });

  const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getPostsForDay = (dateObj) => {
    if (!dateObj) return [];
    return posts.filter(post => {
      if (!post.scheduledDateObj) return false;
      return (
        post.scheduledDateObj.getDate() === dateObj.getDate() &&
        post.scheduledDateObj.getMonth() === dateObj.getMonth() &&
        post.scheduledDateObj.getFullYear() === dateObj.getFullYear()
      );
    });
  };

  const isToday = (dateObj) => {
    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  };

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="calendar-container animate-fade-in">
      <div className="calendar-header">
        <h3>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="calendar-nav-btn" onClick={handlePrevMonth}>❮</button>
          <button className="calendar-nav-btn" onClick={() => setCurrentDate(new Date())}>Hoje</button>
          <button className="calendar-nav-btn" onClick={handleNextMonth}>❯</button>
        </div>
      </div>
      
      <div className="calendar-scroll-wrapper">
        <div className="calendar-grid">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          
          {allDays.map((dayData, index) => {
            const dayPosts = getPostsForDay(dayData.date);
            const todayClass = isToday(dayData.date) ? 'today' : '';
            const monthClass = dayData.isCurrentMonth ? 'current-month' : 'other-month';
            
            return (
              <div key={index} className={`calendar-day ${monthClass} ${todayClass}`}>
                <span className="day-number">{dayData.day}</span>
                {dayPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className={`calendar-post-pill status-${post.status.toLowerCase()}`}
                    onClick={() => onPreview(post)}
                    title={post.title}
                  >
                    <span className="platform-icon">{getPlatformIcon(post.platform)}</span>
                    <span>{post.client || 'Sem Cliente'}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
