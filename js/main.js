// Voli Website JavaScript

// Simple smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation
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

    // Add scroll effect to navigation
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('nav');
        
        if (window.scrollY > 100) {
            nav.style.background = 'rgba(19, 24, 25, 0.95)';
        } else {
            nav.style.background = 'transparent';
        }
    });

    // Simple form validation
    const emailForm = document.querySelector('.email-signup');
    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            const emailInput = this.querySelector('.email-input');
            const email = emailInput.value.trim();
            
            if (!email || !email.includes('@')) {
                e.preventDefault();
                alert('Please enter a valid email address');
                return false;
            }
            
            // If using mailto, let it proceed
            // For future backend integration, handle here
        });
    }

    // Hero icons interaction
    const heroIcons = document.querySelectorAll('.hero-icon');
    const heroDescription = document.getElementById('hero-description');
    const defaultText = 'Coming soon to iOS and Android';

    heroIcons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            const text = icon.getAttribute('data-text');
            heroDescription.textContent = text;
        });

        icon.addEventListener('mouseleave', () => {
            heroDescription.textContent = defaultText;
        });

        icon.addEventListener('click', () => {
            const text = icon.getAttribute('data-text');
            heroDescription.textContent = text;
        });

        // Touch support for mobile
        icon.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent mouse events from firing
            const text = icon.getAttribute('data-text');
            heroDescription.textContent = text;
        });
    });

    // Click anywhere else to reset to default text (mobile)
    document.addEventListener('click', (e) => {
        // Check if click was on an icon or within the hero area
        const clickedIcon = e.target.closest('.hero-icon');
        const clickedHero = e.target.closest('.hero');
        
        // If clicked outside hero area or not on an icon, reset
        if (!clickedIcon && clickedHero) {
            heroDescription.textContent = defaultText;
        }
    });

    // Touch anywhere else to reset (mobile)
    document.addEventListener('touchstart', (e) => {
        const touchedIcon = e.target.closest('.hero-icon');
        const touchedHero = e.target.closest('.hero');
        
        if (!touchedIcon && touchedHero) {
            heroDescription.textContent = defaultText;
        }
    });

    // Character counter for contact form
    const messageTextarea = document.getElementById('message-textarea');
    const characterCounter = document.getElementById('character-counter');
    
    if (messageTextarea && characterCounter) {
        messageTextarea.addEventListener('input', function() {
            const currentLength = this.value.length;
            const maxLength = 1000;
            
            characterCounter.textContent = `${currentLength}/${maxLength}`;
            
            // Add warning class when approaching limit
            if (currentLength >= maxLength * 0.9) {
                characterCounter.classList.add('warning');
            } else {
                characterCounter.classList.remove('warning');
            }
        });
    }

    // Supabase configuration
    const SUPABASE_URL = 'https://xcholkrjpuzahqumajer.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaG9sa3JqcHV6YWhxdW1hamVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDcwMzQsImV4cCI6MjA1OTk4MzAzNH0.RVhKzZkLxwwtbow3i3tUSVVnG_hMl-q0bwuvmqNuDq0';

    // Handle contact form submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            try {
                const formData = {
                    name: this.name.value,
                    email: this.email.value,
                    subject: this.subject.value,
                    message: this.message.value
                };
                
                const response = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Content-Profile': 'admin',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok || response.status === 201) {
                    alert('Message sent successfully! We\'ll get back to you soon.');
                    this.reset();
                    if (characterCounter) characterCounter.textContent = '0/1000';
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to send message. Please try again or email us directly at support@playvoli.com');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Handle newsletter signup
    const signupForm = document.querySelector('.email-signup-pill');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Subscribing...';
            submitBtn.disabled = true;
            
            try {
                const email = this.email.value;
                
                const response = await fetch(`${SUPABASE_URL}/rest/v1/email_subscriptions`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Content-Profile': 'admin',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ email })
                });
                
                if (response.ok || response.status === 201) {
                    alert('Thanks for signing up! We\'ll keep you updated.');
                    this.reset();
                } else if (response.status === 409) {
                    alert('You\'re already subscribed!');
                } else {
                    const errorText = await response.text();
                    console.error('API Error Response:', errorText);
                    console.error('Status:', response.status);
                    throw new Error(`API call failed with status ${response.status}: ${errorText}`);
                }
            } catch (error) {
                console.error('Subscription error:', error);
                console.error('Response status:', error.status);
                console.error('Response text:', error.responseText);
                alert('Failed to subscribe. Please try again or email us directly at support@playvoli.com');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Add loading animation or any future interactive features
    console.log('Voli website loaded successfully!');
});
