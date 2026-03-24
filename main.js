/* ============================================================
   JT Floors – Main JavaScript
   Vanilla JS | No dependencies
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     1. NAVBAR
  ---------------------------------------------------------- */
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  // Solid background on scroll
  window.addEventListener('scroll', () => {
    if (!navbar) return;
    if (window.scrollY > 80) {
      navbar.classList.add('navbar-solid');
    } else {
      navbar.classList.remove('navbar-solid');
    }
  });

  // Mobile hamburger toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('open');
    });
  }

  // Close mobile menu on link click + smooth scroll
  document.querySelectorAll('#navMenu a[href]').forEach(link => {
    link.addEventListener('click', (e) => {
      // Close mobile menu
      if (navToggle && navMenu) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('open');
      }

      // Smooth scroll for anchor links
      const href = link.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ----------------------------------------------------------
     2. GALLERY FILTERS
  ---------------------------------------------------------- */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      // Update active button
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter items
      galleryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.8)';
          item.style.display = '';
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            });
          });
        } else {
          item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          item.style.opacity = '0';
          item.style.transform = 'scale(0.8)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  /* ----------------------------------------------------------
     3. SCROLL ANIMATIONS
  ---------------------------------------------------------- */
  const animateTargets = document.querySelectorAll(
    '.section-header, .service-card, .testimonial-card, .about-content, ' +
    '.about-visual, .contact-info, .contact-form-wrapper'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Stagger grid items
          const parent = entry.target.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter(
              child => animateTargets.length === 0 || child.matches(
                '.service-card, .testimonial-card'
              )
            );
            const index = siblings.indexOf(entry.target);
            if (index > 0) {
              entry.target.style.transitionDelay = `${index * 0.15}s`;
            }
          }
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    animateTargets.forEach(el => observer.observe(el));
  } else {
    // Fallback: show everything immediately
    animateTargets.forEach(el => el.classList.add('animate-in'));
  }

  /* ----------------------------------------------------------
     4. CONTACT FORM
  ---------------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = contactForm.querySelector('#contactName, [name="name"]');
      const phone = contactForm.querySelector('#contactPhone, [name="phone"]');
      const email = contactForm.querySelector('#contactEmail, [name="email"]');

      // Basic validation
      let valid = true;
      [name, phone, email].forEach(field => {
        if (field && !field.value.trim()) {
          field.classList.add('error');
          valid = false;
        } else if (field) {
          field.classList.remove('error');
        }
      });

      if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        email.classList.add('error');
        valid = false;
      }

      if (!valid) return;

      // Show success message
      const wrapper = contactForm.closest('.contact-form-wrapper') || contactForm.parentElement;
      wrapper.innerHTML = `
        <div class="form-success">
          <div class="form-success-icon">\u2713</div>
          <h3>Message Sent!</h3>
          <p>Thanks, ${name ? name.value.trim() : ''}! We'll get back to you within a few hours.</p>
        </div>
      `;
    });
  }

  /* ----------------------------------------------------------
     5. CHATBOT WIDGET
  ---------------------------------------------------------- */
  (function initChatbot() {
    // Create DOM
    const fab = document.createElement('div');
    fab.className = 'chatbot-fab';
    fab.id = 'chatbotFab';
    fab.title = 'Chat with us';
    fab.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>`;

    const win = document.createElement('div');
    win.className = 'chatbot-window';
    win.id = 'chatbotWindow';
    win.innerHTML = `
      <div class="chatbot-header">
        <span>Chat with JT Floors</span>
        <button class="chatbot-close" id="chatbotClose">&times;</button>
      </div>
      <div class="chatbot-messages" id="chatbotMessages"></div>
      <div class="chatbot-input-area">
        <input type="text" id="chatbotInput" placeholder="Type a message...">
        <button id="chatbotSend">Send</button>
      </div>`;

    document.body.appendChild(fab);
    document.body.appendChild(win);

    const messages = document.getElementById('chatbotMessages');
    const input = document.getElementById('chatbotInput');
    const sendBtn = document.getElementById('chatbotSend');
    const closeBtn = document.getElementById('chatbotClose');
    let welcomed = false;

    // Toggle window
    fab.addEventListener('click', () => {
      win.classList.toggle('open');
      if (win.classList.contains('open') && !welcomed) {
        welcomed = true;
        addBotMessage("Hi! \uD83D\uDC4B I'm the JT Floors assistant. How can I help you today?");
      }
      if (win.classList.contains('open')) {
        input.focus();
      }
    });

    closeBtn.addEventListener('click', () => {
      win.classList.remove('open');
    });

    // Send message
    function sendUserMessage() {
      const text = input.value.trim();
      if (!text) return;
      addUserMessage(text);
      input.value = '';
      showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        const reply = getBotReply(text);
        addBotMessage(reply.text);
        if (reply.action === 'booking') {
          addQuickAction('Book Now', () => {
            win.classList.remove('open');
            openBooking();
          });
        }
      }, 500);
    }

    sendBtn.addEventListener('click', sendUserMessage);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendUserMessage();
    });

    function addUserMessage(text) {
      const div = document.createElement('div');
      div.className = 'chat-message user';
      div.textContent = text;
      messages.appendChild(div);
      scrollMessages();
    }

    function addBotMessage(text) {
      const div = document.createElement('div');
      div.className = 'chat-message bot';
      // Support simple markdown-style links [text](url)
      div.innerHTML = text.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2">$1</a>'
      );
      messages.appendChild(div);
      scrollMessages();
    }

    function addQuickAction(label, callback) {
      const div = document.createElement('div');
      div.className = 'chat-quick-action';
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary btn-small';
      btn.textContent = label;
      btn.addEventListener('click', callback);
      div.appendChild(btn);
      messages.appendChild(div);
      scrollMessages();
    }

    function showTypingIndicator() {
      const div = document.createElement('div');
      div.className = 'chat-message bot typing-indicator';
      div.id = 'typingIndicator';
      div.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
      messages.appendChild(div);
      scrollMessages();
    }

    function removeTypingIndicator() {
      const el = document.getElementById('typingIndicator');
      if (el) el.remove();
    }

    function scrollMessages() {
      messages.scrollTop = messages.scrollHeight;
    }

    function getBotReply(text) {
      const lower = text.toLowerCase();
      const replies = [
        {
          pattern: /price|cost|quote|estimate/,
          text: "For a quick estimate, try our [Quote Estimator](estimator.html)! For an accurate quote, call us on 0400 000 000 or fill out our contact form."
        },
        {
          pattern: /carpet/,
          text: "We supply and install all types of carpet \u2014 from budget-friendly polyester to premium wool. Prices start from $50/LM supplied and installed."
        },
        {
          pattern: /hybrid|laminate/,
          text: "Hybrid and laminate are great choices! Waterproof, durable, and beautiful timber looks. Starting from $45/m\u00B2 supplied and installed."
        },
        {
          pattern: /timber|hardwood/,
          text: "We install solid and engineered timber floors, plus sanding and polishing. Prices from $80/m\u00B2 depending on species."
        },
        {
          pattern: /vinyl|lvp/,
          text: "Luxury vinyl plank is perfect for wet areas and high traffic. From $35/m\u00B2 supplied and installed."
        },
        {
          pattern: /book|appointment|booking/,
          text: "You can book a free measure and quote! Click the 'Book Now' option below or call us on 0400 000 000.",
          action: 'booking'
        },
        {
          pattern: /hours|open|available/,
          text: "We're available Monday to Saturday, 7am \u2013 5pm. We can often accommodate after-hours appointments too."
        },
        {
          pattern: /area|suburb|location|where/,
          text: "We service all Melbourne metro areas and surrounding suburbs including Geelong, Ballarat, and the Mornington Peninsula."
        }
      ];

      for (const r of replies) {
        if (r.pattern.test(lower)) {
          return { text: r.text, action: r.action || null };
        }
      }

      return {
        text: "Thanks for your message! For specific queries, give us a call on 0400 000 000 or fill out our contact form below. We usually respond within a few hours.",
        action: null
      };
    }
  })();

  /* ----------------------------------------------------------
     6. ONLINE BOOKING SYSTEM
  ---------------------------------------------------------- */
  (function initBooking() {
    // Create DOM
    const overlay = document.createElement('div');
    overlay.className = 'booking-overlay';
    overlay.id = 'bookingOverlay';

    const modal = document.createElement('div');
    modal.className = 'booking-modal';
    modal.id = 'bookingModal';
    modal.innerHTML = `
      <div class="booking-content">
        <button class="booking-close" id="bookingClose">&times;</button>
        <h2>Book a Free Measure &amp; Quote</h2>
        <p>Select a date and available time slot below.</p>

        <div class="booking-calendar" id="bookingCalendar">
          <div class="calendar-header">
            <button id="calPrev">&lsaquo;</button>
            <span id="calMonth"></span>
            <button id="calNext">&rsaquo;</button>
          </div>
          <div class="calendar-weekdays">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
          <div class="calendar-grid" id="calendarGrid"></div>
        </div>

        <div class="time-slots hidden" id="timeSlots">
          <h3>Available Times for <span id="selectedDateText"></span></h3>
          <div class="time-slots-grid" id="timeSlotsGrid"></div>
        </div>

        <div class="booking-form hidden" id="bookingForm">
          <h3>Your Details</h3>
          <div class="form-group">
            <label>Name</label>
            <input type="text" id="bookingName" required placeholder="Your name">
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" id="bookingPhone" required placeholder="Your phone">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="bookingEmail" required placeholder="your@email.com">
          </div>
          <div class="form-group">
            <label>Address (for measure &amp; quote)</label>
            <input type="text" id="bookingAddress" placeholder="Street address, suburb">
          </div>
          <div class="form-group">
            <label>Notes (optional)</label>
            <textarea id="bookingNotes" rows="2" placeholder="Any details about your project..."></textarea>
          </div>
          <button class="btn btn-primary btn-full" id="bookingSubmit">Confirm Booking</button>
        </div>

        <div class="booking-confirm hidden" id="bookingConfirm">
          <div class="confirm-icon">\u2713</div>
          <h3>Booking Confirmed!</h3>
          <p id="confirmDetails"></p>
          <p>We'll send you a confirmation via email and SMS. If you need to change your appointment, call us on 0400 000 000.</p>
          <button class="btn btn-outline" id="bookingDone">Done</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // State
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth();
    let selectedDate = null;
    let selectedTime = null;

    // Seeded random for consistent "booked" days/slots per session
    function seededRandom(seed) {
      let x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    }

    // Elements
    const calMonth = document.getElementById('calMonth');
    const calGrid = document.getElementById('calendarGrid');
    const calPrev = document.getElementById('calPrev');
    const calNext = document.getElementById('calNext');
    const timeSlotsSection = document.getElementById('timeSlots');
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    const selectedDateText = document.getElementById('selectedDateText');
    const bookingFormSection = document.getElementById('bookingForm');
    const bookingConfirmSection = document.getElementById('bookingConfirm');
    const bookingCloseBtn = document.getElementById('bookingClose');
    const bookingSubmitBtn = document.getElementById('bookingSubmit');
    const bookingDoneBtn = document.getElementById('bookingDone');
    const confirmDetails = document.getElementById('confirmDetails');

    // Render calendar
    function renderCalendar() {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      calMonth.textContent = `${monthNames[viewMonth]} ${viewYear}`;

      const firstDay = new Date(viewYear, viewMonth, 1);
      const lastDay = new Date(viewYear, viewMonth + 1, 0);
      // Monday = 0, Sunday = 6
      let startDow = firstDay.getDay() - 1;
      if (startDow < 0) startDow = 6;

      calGrid.innerHTML = '';

      // Empty cells before first day
      for (let i = 0; i < startDow; i++) {
        const empty = document.createElement('span');
        empty.className = 'calendar-day empty';
        calGrid.appendChild(empty);
      }

      for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = new Date(viewYear, viewMonth, d);
        const dayEl = document.createElement('span');
        dayEl.className = 'calendar-day';
        dayEl.textContent = d;

        const isPast = date < today;
        const isSunday = date.getDay() === 0;
        const seed = viewYear * 10000 + (viewMonth + 1) * 100 + d;
        const isBookedOut = seededRandom(seed) < 0.15;

        if (isPast || isSunday) {
          dayEl.classList.add('disabled');
        } else if (isBookedOut) {
          dayEl.classList.add('disabled', 'booked-out');
          dayEl.title = 'Fully booked';
        } else {
          dayEl.classList.add('available');
          dayEl.addEventListener('click', () => selectDate(date, dayEl));
        }

        calGrid.appendChild(dayEl);
      }

      // Disable prev if viewing current month
      const currentMonth = today.getFullYear() * 12 + today.getMonth();
      const viewingMonth = viewYear * 12 + viewMonth;
      calPrev.disabled = viewingMonth <= currentMonth;
    }

    calPrev.addEventListener('click', () => {
      const currentMonth = today.getFullYear() * 12 + today.getMonth();
      const viewingMonth = viewYear * 12 + viewMonth;
      if (viewingMonth > currentMonth) {
        viewMonth--;
        if (viewMonth < 0) {
          viewMonth = 11;
          viewYear--;
        }
        resetSelections();
        renderCalendar();
      }
    });

    calNext.addEventListener('click', () => {
      viewMonth++;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear++;
      }
      resetSelections();
      renderCalendar();
    });

    function resetSelections() {
      selectedDate = null;
      selectedTime = null;
      timeSlotsSection.classList.add('hidden');
      bookingFormSection.classList.add('hidden');
      bookingConfirmSection.classList.add('hidden');
    }

    function selectDate(date, dayEl) {
      selectedDate = date;
      selectedTime = null;

      // Highlight selected day
      calGrid.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
      dayEl.classList.add('selected');

      // Show time slots
      const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
      const isSaturday = dayOfWeek === 6;
      const slots = isSaturday
        ? ['8:00am', '9:00am', '10:00am', '11:00am']
        : ['7:00am', '8:00am', '9:00am', '10:00am', '11:00am', '1:00pm', '2:00pm', '3:00pm', '4:00pm'];

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dateStr = `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      selectedDateText.textContent = dateStr;

      timeSlotsGrid.innerHTML = '';
      const dateSeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

      slots.forEach((slot, i) => {
        const slotSeed = dateSeed * 100 + i;
        const isUnavailable = seededRandom(slotSeed) < 0.3;
        if (isUnavailable) return; // skip unavailable slots

        const btn = document.createElement('button');
        btn.className = 'time-slot';
        btn.textContent = slot;
        btn.addEventListener('click', () => selectTimeSlot(slot, btn));
        timeSlotsGrid.appendChild(btn);
      });

      timeSlotsSection.classList.remove('hidden');
      bookingFormSection.classList.add('hidden');
      bookingConfirmSection.classList.add('hidden');
    }

    function selectTimeSlot(time, btn) {
      selectedTime = time;
      timeSlotsGrid.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
      btn.classList.add('selected');
      bookingFormSection.classList.remove('hidden');
      bookingConfirmSection.classList.add('hidden');
    }

    // Submit booking
    bookingSubmitBtn.addEventListener('click', () => {
      const name = document.getElementById('bookingName');
      const phone = document.getElementById('bookingPhone');
      const email = document.getElementById('bookingEmail');

      let valid = true;
      [name, phone, email].forEach(field => {
        if (!field.value.trim()) {
          field.classList.add('error');
          valid = false;
        } else {
          field.classList.remove('error');
        }
      });

      if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        email.classList.add('error');
        valid = false;
      }

      if (!valid) return;

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dateStr = `${dayNames[selectedDate.getDay()]} ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

      confirmDetails.textContent = `${name.value.trim()}, your appointment is booked for ${dateStr} at ${selectedTime}.`;

      bookingFormSection.classList.add('hidden');
      timeSlotsSection.classList.add('hidden');
      document.getElementById('bookingCalendar').classList.add('hidden');
      bookingConfirmSection.classList.remove('hidden');
    });

    // Open / Close booking modal
    function openBookingModal() {
      // Reset state
      viewYear = today.getFullYear();
      viewMonth = today.getMonth();
      selectedDate = null;
      selectedTime = null;

      // Reset form fields
      ['bookingName', 'bookingPhone', 'bookingEmail', 'bookingAddress', 'bookingNotes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.value = '';
          el.classList.remove('error');
        }
      });

      // Reset visibility
      timeSlotsSection.classList.add('hidden');
      bookingFormSection.classList.add('hidden');
      bookingConfirmSection.classList.add('hidden');
      document.getElementById('bookingCalendar').classList.remove('hidden');

      renderCalendar();

      overlay.classList.add('active');
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeBookingModal() {
      overlay.classList.remove('active');
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    bookingCloseBtn.addEventListener('click', closeBookingModal);
    overlay.addEventListener('click', closeBookingModal);
    bookingDoneBtn.addEventListener('click', closeBookingModal);

    // Expose globally
    window.openBooking = openBookingModal;

    /* --------------------------------------------------------
       7. BOOKING TRIGGERS
    -------------------------------------------------------- */
    document.querySelectorAll('[data-open-booking]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openBookingModal();
      });
    });

    // Also listen for dynamically added triggers
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-booking]');
      if (trigger) {
        e.preventDefault();
        openBookingModal();
      }
    });
  })();

});
