// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Interactive button functionality
const clickBtn = document.getElementById('clickBtn');
const messageDiv = document.getElementById('message');

const messages = [
    "🎉 Awesome! You clicked the button!",
    "✨ Great job! The website is working perfectly!",
    "🚀 Nice! Your local server is running smoothly!",
    "💫 Fantastic! Everything is set up correctly!",
    "🌟 Excellent! Your website is fully functional!"
];

let clickCount = 0;

clickBtn.addEventListener('click', function() {
    clickCount++;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    messageDiv.textContent = `${randomMessage} (Click #${clickCount})`;
    messageDiv.classList.add('show');
    
    // Add a fun animation to the button
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
        this.style.transform = 'scale(1)';
    }, 150);
});

// Contact form functionality
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('form-message');

contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const messageText = document.getElementById('message-text').value;
    
    // Simulate form submission
    formMessage.textContent = `Thanks ${name}! Your message has been received. (This is a demo - no actual email was sent)`;
    formMessage.classList.add('show');
    
    // Reset form
    contactForm.reset();
    
    // Hide message after 5 seconds
    setTimeout(() => {
        formMessage.classList.remove('show');
    }, 5000);
});

// Add scroll effect to header
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Add typing effect to hero text
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Initialize typing effect when page loads
window.addEventListener('load', function() {
    const heroTitle = document.querySelector('.hero-content h2');
    const originalText = heroTitle.textContent;
    
    // Add a small delay before starting the typing effect
    setTimeout(() => {
        typeWriter(heroTitle, originalText, 80);
    }, 500);
});

// Add parallax effect to hero section
window.addEventListener('scroll', function() {
    const hero = document.querySelector('.hero');
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    if (hero) {
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Add animation on scroll for feature cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards
document.addEventListener('DOMContentLoaded', function() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Add current year to footer
document.addEventListener('DOMContentLoaded', function() {
    const footer = document.querySelector('footer p');
    if (footer) {
        footer.innerHTML = footer.innerHTML.replace('2025', new Date().getFullYear());
    }
});

console.log('🎉 Website loaded successfully! Everything is working perfectly on your local machine.');