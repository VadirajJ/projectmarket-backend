document.addEventListener("DOMContentLoaded", () => {

  /* ================= HEADER SCROLL ================= */
  const header = document.querySelector(".top-header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 100);
  });

  /* ================= MOBILE MENU ================= */
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");
  const closeMenu = document.querySelector(".close-menu");

  const closeMobileMenu = () => {
    mobileMenu.classList.remove("active");
    mobileMenuOverlay.classList.remove("active");
    document.body.style.overflow = "";
  };

  mobileMenuBtn?.addEventListener("click", () => {
    mobileMenu.classList.add("active");
    mobileMenuOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  });

  closeMenu?.addEventListener("click", closeMobileMenu);
  mobileMenuOverlay?.addEventListener("click", closeMobileMenu);

  /* ================= COUNTER ================= */
  const animateCounter = (counter) => {
  const target = +counter.dataset.target;
  let current = 0;
  const step = target / 100;

  const update = () => {
    current += step;
    if (current < target) {
      counter.textContent = Math.floor(current);
      requestAnimationFrame(update);
    } else {
      counter.textContent = target; // ✅ NO "+"
    }
  };

  update();
};


  /* ================= SCROLL ANIMATION ================= */
  const animateOnScroll = () => {
    document.querySelectorAll("[data-animation]").forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight / 1.2) {
        el.classList.add("animated");
        if (el.classList.contains("stat-box")) {
          animateCounter(el.querySelector(".counter"));
        }
      }
    });
  };

  window.addEventListener("scroll", animateOnScroll);
  animateOnScroll();

  /* ================= SWIPER ================= */
  // if (window.Swiper) {
  //   new Swiper(".heroSwiper", {
  //     loop: true,
  //     speed: 1000,
  //     autoplay: { delay: 5000 },
  //     effect: "fade",
  //     pagination: { el: ".swiper-pagination", clickable: true },
  //     navigation: {
  //       nextEl: ".swiper-button-next",
  //       prevEl: ".swiper-button-prev"
  //     }
  //   });
  // }


  /* ================= FORM ================= */
  const quoteForm = document.getElementById("quote-form");
  const submitBtn = document.getElementById("submit-btn");

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const mobileInput = document.getElementById("mobile");
  const companyInput = document.getElementById("company");
  const designationInput = document.getElementById("designation");
  const serviceSelect = document.getElementById("service");
   
  const messageInput = document.getElementById("message");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[6-9]\d{9}$/;

  function showError(id, msg) {
    const err = document.getElementById(`${id}-error`);
    const input = document.getElementById(id);
    if (err && input) {
      err.textContent = msg;
      err.classList.add("show");
      input.style.borderColor = "#ff4757";
    }
  }

  function clearErrors() {
    document.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.classList.remove("show");
    });
    document.querySelectorAll("input,select,textarea").forEach(i => {
      i.style.borderColor = "#ddd";
    });
  }

  function validateForm() {
    clearErrors();
    let valid = true;

    if (nameInput.value.trim().length < 2) { showError("name", "Name required"); valid = false; }
    if (!emailRegex.test(emailInput.value)) { showError("email", "Invalid email"); valid = false; }
    if (!mobileRegex.test(mobileInput.value)) { showError("mobile", "Enter 10 Digit mobile no"); valid = false; }
    if (!companyInput.value.trim()) { showError("company", "Company required"); valid = false; }
    if (!designationInput.value.trim()) { showError("designation", "Designation required"); valid = false; }
    if (!serviceSelect.value) { showError("service", "Select service"); valid = false; }
    if (messageInput.value.trim().length < 10) { showError("message", "Min 10 characters"); valid = false; }

    return valid;
  }

  /* ================= SUBMIT WITH BEAUTIFUL SUCCESS ANIMATIONS ================= */
quoteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  const originalText = "Submit";
  submitBtn.textContent = "Submitting...";
  submitBtn.disabled = true;

  const formData = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    mobile: mobileInput.value.trim(),
    company: companyInput.value.trim(),
    designation: designationInput.value.trim(),
    service: serviceSelect.value,
    message: messageInput.value.trim()
  };

  try {
    const response = await fetch("/submit-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.status === "success") {
      showSuccessNotification("✅ Registered Successfully!");
      quoteForm.reset();
      clearErrors();
    } 
    else if (result.status === "exists") {
    showErrorNotification("⚠️ Email already registered. Please login.");

    const loginModal = document.getElementById("loginModal");
    const loginForm = document.getElementById("loginForm");
    const loginEmail = document.getElementById("login_email");

    if (loginModal) {
        loginModal.style.display = "flex";
    }

    // Clear old login data
    if (loginForm) {
        loginForm.reset();
    }

    // Auto-fill email again
    if (loginEmail) {
        loginEmail.value = emailInput.value.trim();
    }
}
    else {
      showErrorNotification("❌ Something went wrong.");
    }

  } catch (err) {
    console.error(err);
    showErrorNotification("❌ Server error");
  }

  // 🔹 ALWAYS reset button
  submitBtn.textContent = originalText;
  submitBtn.disabled = false;
});


  /* ================= BEAUTIFUL SUCCESS NOTIFICATION ================= */
  function showSuccessNotification(message) {
    // Remove any existing notification
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) existingNotification.remove();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'custom-notification success';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🎉</div>
        <div class="notification-text">${message}</div>
        <div class="notification-close">×</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 4000);
    
    // Close on click
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    });
  }

  /* ================= ERROR NOTIFICATION ================= */
  function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'custom-notification error';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">❌</div>
        <div class="notification-text">${message}</div>
        <div class="notification-close">×</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    }, 4000);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    });
  }

  /* ================= DANCE CURSOR TO SERVICES ================= */
  function danceCursorToServices() {
    const servicesSection = document.querySelector('.services-section');
    if (!servicesSection) return;
    
    // Get position of services section
    const servicesRect = servicesSection.getBoundingClientRect();
    const targetX = servicesRect.left + (servicesRect.width / 2) + window.scrollX;
    const targetY = servicesRect.top + (servicesRect.height / 2) + window.scrollY;
    
    // Create dancing cursor element
    const cursor = document.createElement('div');
    cursor.className = 'dancing-cursor';
    cursor.innerHTML = '👆';
    cursor.style.cssText = `
      position: fixed;
      font-size: 40px;
      z-index: 999999;
      pointer-events: none;
      top: ${window.scrollY + 100}px;
      left: ${window.scrollX + 100}px;
      transform: translate(-50%, -50%);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(cursor);
    
    // Dance animation path
    const danceMoves = [
      {x: targetX - 100, y: targetY - 100},
      {x: targetX + 80, y: targetY - 50},
      {x: targetX - 60, y: targetY + 70},
      {x: targetX + 40, y: targetY - 30},
      {x: targetX, y: targetY}
    ];
    
    let moveIndex = 0;
    
    function nextMove() {
      if (moveIndex < danceMoves.length) {
        const move = danceMoves[moveIndex];
        cursor.style.left = `${move.x}px`;
        cursor.style.top = `${move.y}px`;
        
        // Add bounce effect
        cursor.style.transform = `translate(-50%, -50%) scale(${moveIndex === danceMoves.length - 1 ? 1.5 : 1.2})`;
        
        setTimeout(() => {
          cursor.style.transform = `translate(-50%, -50%) scale(1)`;
        }, 150);
        
        moveIndex++;
        setTimeout(nextMove, 300);
      } else {
        // Final pulse animation at services section
        cursor.innerHTML = '⭐';
        cursor.style.fontSize = '60px';
        
        // Create pulse effect
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            cursor.style.transform = `translate(-50%, -50%) scale(${1.5 + i * 0.3})`;
            cursor.style.opacity = `${1 - i * 0.3}`;
          }, i * 200);
        }
        
        // Remove cursor after animation
        setTimeout(() => {
          cursor.remove();
          
          // Highlight services section
          highlightServicesSection();
        }, 1000);
      }
    }
    
    nextMove();
  }

  /* ================= HIGHLIGHT SERVICES SECTION ================= */
  function highlightServicesSection() {
    const servicesSection = document.querySelector('.services-section');
    if (!servicesSection) return;
    
    // Add highlight glow
    servicesSection.style.boxShadow = '0 0 30px rgba(23, 146, 222, 0.7)';
    servicesSection.style.transition = 'box-shadow 0.5s ease';
    
    // Create floating particles around services
    createParticlesAroundElement(servicesSection);
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      servicesSection.style.boxShadow = '';
    }, 3000);
  }

  /* ================= PARTICLE EFFECTS ================= */
  function createParticlesAroundElement(element) {
    const rect = element.getBoundingClientRect();
    const colors = ['#3498db;',  '#f1c40f', '#e74c3c', '#9b59b6'];
    
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        top: ${rect.top + Math.random() * rect.height}px;
        left: ${rect.left + Math.random() * rect.width}px;
        animation: floatParticle 2s ease-out forwards;
      `;
      
      document.body.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => particle.remove(), 2000);
    }
  }

  /* ================= GET QUOTE BUTTONS ================= */
  const getQuoteButtons = document.querySelectorAll('.quote-btn, .mobile-quote-btn, .hero-btn, .get-quote-btn');
  
  getQuoteButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Ripple effect
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size/2;
      const y = e.clientY - rect.top - size/2;
      
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255,255,255,0.7);
        transform: scale(0);
        animation: ripple 0.6s linear;
        width: ${size}px;
        height: ${size}px;
        top: ${y}px;
        left: ${x}px;
        pointer-events: none;
      `;
      
      button.style.position = 'relative';
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
      
      // Scroll to form
      const servicesSection = document.querySelector('.services-section');
      if (servicesSection) {
        window.scrollTo({
          top: servicesSection.offsetTop - 100,
          behavior: 'smooth'
        });
        
        // Highlight form after scroll
        setTimeout(() => {
          highlightQuoteForm();
        }, 800);
      }
      
      closeMobileMenu();
    });
  });

  /* ================= HIGHLIGHT QUOTE FORM ================= */
  function highlightQuoteForm() {
    const quoteBox = document.querySelector('.quote-box');
    if (!quoteBox) return;
    
    // Add glow effect
    quoteBox.style.boxShadow = '0 0 25px rgba(15, 150, 228, 0.5)';
    quoteBox.style.transform = 'scale(1.02)';
    quoteBox.style.transition = 'all 0.5s ease';
    
    // Animate form inputs
    const inputs = quoteBox.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
      setTimeout(() => {
        input.style.transform = 'translateX(-5px)';
        input.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        
        setTimeout(() => {
          input.style.transform = 'translateX(0)';
          input.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
          
          // Focus on first input
          if (index === 0) {
            input.focus();
            input.style.animation = 'pulseBorder 1s ease';
          }
        }, 300);
      }, index * 100);
    });
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      quoteBox.style.boxShadow = '';
      quoteBox.style.transform = '';
    }, 3000);
  }

  /*adds video*/
// Safe Close Button Functionality

const overlay = document.getElementById("adOverlay");
const video = document.getElementById("myAdVideo");
const closeBtn = document.getElementById("closeAdBtn");

if (overlay && closeBtn) {

    closeBtn.addEventListener("click", function () {
        overlay.style.display = "none";

        if (video) {
            video.pause();
        }
    });

    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
            overlay.style.display = "none";

            if (video) {
                video.pause();
            }
        }
    });

}


    // // 2. CLOSE BUTTON FUNCTIONALITY
    // closeBtn.onclick = function() {
    //     overlay.style.display = 'none';
    //     video.pause(); // Stop video when closed
    // };

    // // 3. CLOSE IF CLICKED OUTSIDE THE WHITE BOX
    // overlay.onclick = function(event) {
    //     if (event.target === overlay) {
    //         overlay.style.display = 'none';
    //         video.pause();
    //     }
    // };


    /* popup */

// // Get DOM elements
// const plansBtn = document.querySelector('.plans-btn');
// const plansPopup = document.getElementById('plansPopup');
// const closePopupBtn = document.querySelector('.close-popup');
// const selectPlanBtns = document.querySelectorAll('.select-plan');

// // Open popup when Plans button is clicked
// plansBtn.addEventListener('click', () => {
//   plansPopup.style.display = 'flex';
//   document.body.style.overflow = 'hidden'; // Prevent scrolling
// });

// // Close popup when close button is clicked
// closePopupBtn.addEventListener('click', () => {
//   plansPopup.style.display = 'none';
//   document.body.style.overflow = 'auto';
// });

// // Close popup when clicking outside the content
// plansPopup.addEventListener('click', (e) => {
//   if (e.target === plansPopup) {
//     plansPopup.style.display = 'none';
//     document.body.style.overflow = 'auto';
//   }
// });

// // Close popup with Escape key
// document.addEventListener('keydown', (e) => {
//   if (e.key === 'Escape' && plansPopup.style.display === 'flex') {
//     plansPopup.style.display = 'none';
//     document.body.style.overflow = 'auto';
//   }
// });

// // Handle plan selection
// selectPlanBtns.forEach(btn => {
//   btn.addEventListener('click', () => {
//     const planName = btn.closest('.plan-card').querySelector('h3').textContent;
//     alert(`You selected the ${planName}. Our team will contact you shortly!`);
//     plansPopup.style.display = 'none';
//     document.body.style.overflow = 'auto';
//   });
// });

/*---------Drop down -----------*/
  
  /* Validation compatibility */
  function validateService() {
    if (!hiddenInput.value) {
      showError("service", "Select service");
      select.classList.add("error");
      return false;
    }
    select.classList.remove("error");
    return true;
  }




/*---------plan pdf --------*/






  /* ================= ADD ALL CSS ANIMATIONS ================= */
  const style = document.createElement('style');
  style.textContent = `
    /* Success Notification */
    .custom-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      padding: 15px 20px;
      z-index: 99999;
      transform: translateX(150%);
      transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      min-width: 300px;
      border-left: 5px solid #1188e3;
    }
    
    .custom-notification.success {
      border-left-color: #00b894;
    }
    
    .custom-notification.error {
      border-left-color: #ff4757;
    }
    
    .custom-notification.show {
      transform: translateX(0);
    }
    
    .notification-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .notification-icon {
      font-size: 24px;
      animation: bounce 2s infinite;
    }
    
    .notification-text {
      flex: 1;
      font-weight: 500;
      color: #333;
    }
    
    .notification-close {
      cursor: pointer;
      font-size: 24px;
      color: #999;
      transition: color 0.3s;
    }
    
    .notification-close:hover {
      color: #333;
    }
    
    /* Dancing Cursor */
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    /* Ripple Effect */
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    /* Pulse Border for Input */
    @keyframes pulseBorder {
      0% { box-shadow: 0 0 0 0 rgba(18, 139, 205, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(76, 229, 53, 0); }
      100% { box-shadow: 0 0 0 0 rgba(76, 229, 53, 0); }
    }
    
    /* Float Animation for Particles */
    @keyframes floatParticle {
      0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(0);
        opacity: 0;
      }
    }
    
    /* Dancing Animation for Cursor */
    @keyframes dance {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      25% { transform: translate(-50%, -50%) rotate(10deg); }
      50% { transform: translate(-50%, -50%) rotate(-10deg); }
      75% { transform: translate(-50%, -50%) rotate(5deg); }
      100% { transform: translate(-50%, -50%) rotate(0deg); }
    }
    
    .dancing-cursor {
      animation: dance 0.5s infinite;
    }
    
    /* Services Highlight */
    @keyframes servicesGlow {
      0% { box-shadow: 0 0 10px rgba(76, 229, 53, 0.5); }
      50% { box-shadow: 0 0 30px rgba(76, 229, 53, 0.8); }
      100% { box-shadow: 0 0 10px rgba(76, 229, 53, 0.5); }
    }
    
    .services-highlight {
      animation: servicesGlow 2s infinite;
    }
  `;
  document.head.appendChild(style);

  console.log("✅ JavaScript loaded with beautiful animations!");
});
/*sound button*/
 src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"
  const swiper = new Swiper('.heroSwiper', {
  loop: true,
  autoplay: {
    delay: 4000,
    disableOnInteraction: false
  },
  speed: 900,
  pagination: {
    el: '.swiper-pagination',
    clickable: true
  },
  on: {
    init(swiper) {
      playCurrentVideo(swiper);
    },
    slideChangeTransitionStart(swiper) {
      pauseAllVideos();
    },
    slideChangeTransitionEnd(swiper) {
      playCurrentVideo(swiper);
    }
  }
});

/* Pause ALL videos (including cloned ones) */
function pauseAllVideos() {
  document.querySelectorAll('.slide-video').forEach(video => {
    video.pause();
    video.currentTime = 0;
  });
}

/* Play ONLY active slide video (handles loop clones correctly) */
function playCurrentVideo(swiper) {
  const activeSlide = swiper.slides[swiper.activeIndex];
  const video = activeSlide.querySelector('video');

  if (video) {
    video.muted = true; // required for autoplay
    video.play().catch(() => {});
  }
}

// watsapp//

function toggleWhatsApp() {
  document.getElementById("whatsappPopup").classList.toggle("show");
}
  
// scroll//
const track = document.querySelector(".logo-track");
if (track) {
  track.addEventListener("click", () => {
    track.style.animationDuration = "8s";
    setTimeout(() => {
      track.style.animationDuration = "25s";
    }, 2000);
  });
}

// csss /// 
// Open mega menu on mobile click
  document.querySelectorAll('.nav-item.mega-parent').forEach(item => {
    item.addEventListener('click', function(e) {
      if (window.innerWidth <= 576 || ('ontouchstart' in window)) {
        e.preventDefault();
        // close others
        document.querySelectorAll('.nav-item.active').forEach(el => {
          if (el !== this) el.classList.remove('active');
        });
        this.classList.toggle('active');
      }
    });
  });
  // close when tapping outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-item')) {
      document.querySelectorAll('.nav-item.active').forEach(el => {
        el.classList.remove('active');
      });
    }
  });


  // pop up Login //
  // pop up Login //
// Login Popup
const modal = document.getElementById("loginModal");
const form = document.getElementById("loginForm");

if (modal && form) {

  // Auto open login popup when page loads
  window.addEventListener("load", () => {
    modal.style.display = "flex";
  });

  // Close popup
  window.closeLogin = () => {
    modal.style.display = "none";
  };

  // Form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    try {
      const res = await fetch("/login", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      // ===== SUCCESS LOGIN =====
      if (data.status === "success") {
        modal.style.display = "none";

        const welcomeBox = document.getElementById("welcomeMessage");
        if (welcomeBox) {
          welcomeBox.classList.add("show");
          setTimeout(() => {
            welcomeBox.classList.remove("show");
          }, 2500);
        }
      }

      // ===== EMAIL NOT REGISTERED =====
      else if (data.status === "not_found") {
        const errorBox = document.getElementById("errorMessage");
        if (errorBox) {
          errorBox.classList.add("show");
          setTimeout(() => {
            errorBox.classList.remove("show");
          }, 2500);
        }
      }

      // ===== OTHER ERROR =====
      else {
        showServerError();
      }

    } catch (err) {
      console.log(err);
      showServerError();
    }
  });
}


// Server error animation
function showServerError() {
  const errorBox = document.getElementById("errorMessage");
  if (errorBox) {
    errorBox.querySelector("h2").innerText = "Server Error";
    errorBox.querySelector("p").innerText = "Please try again later";

    errorBox.classList.add("show");

    setTimeout(() => {
      errorBox.classList.remove("show");
    }, 2500);
  }
}



// clients slide//
// const cards = document.querySelectorAll(".testimonial-card");

// cards.forEach(card => {
//   card.addEventListener("mousemove", (e) => {
//     const rect = card.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     const centerX = rect.width / 2;
//     const centerY = rect.height / 2;

//     const rotateX = (y - centerY) / 12;
//     const rotateY = (centerX - x) / 12;

//     card.style.transform =
//       `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
//   });

//   card.addEventListener("mouseleave", () => {
//     card.style.transform = "rotateX(0) rotateY(0) scale(1)";
//   });
// });




