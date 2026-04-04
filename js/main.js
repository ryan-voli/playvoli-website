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
    const defaultText = 'Now available on iOS and Android';
    let activeIcon = null;

    // Define unique colors for each icon
    const iconColors = {
        'fantasy.png': '#C8FF00',      // Lemon-lime (brand color)
        'community.png': '#00F0FF',    // Electric-blue (brand color)
        'content.png': '#FF1F6D',      // Rose (brand color)
        'games.png': '#FF6B35',        // Orange (complementary)
        'statistics.png': '#9D4EDD'    // Purple (complementary)
    };

    // Function to smoothly update text with fade effect
    function updateDescriptionText(newText) {
        // Fade out
        heroDescription.style.opacity = '0';

        // Wait for fade out, then change text and fade in
        setTimeout(() => {
            heroDescription.textContent = newText;
            heroDescription.style.opacity = '1';
        }, 300);
    }

    heroIcons.forEach(icon => {
        // Get the color for this icon based on its src
        const iconSrc = icon.getAttribute('src');
        const iconName = iconSrc.split('/').pop();
        const iconColor = iconColors[iconName] || '#C8FF00';

        icon.addEventListener('mouseenter', () => {
            const text = icon.getAttribute('data-text');
            updateDescriptionText(text);
        });

        icon.addEventListener('mouseleave', () => {
            updateDescriptionText(defaultText);
        });

        icon.addEventListener('click', () => {
            // Remove highlight from previously active icon
            if (activeIcon) {
                activeIcon.style.filter = '';
            }

            // Add highlight to clicked icon with its unique color
            icon.style.filter = `drop-shadow(0 0 8px ${iconColor})`;
            activeIcon = icon;

            const text = icon.getAttribute('data-text');
            updateDescriptionText(text);
        });

        // Touch support for mobile
        icon.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent mouse events from firing

            // Remove highlight from previously active icon
            if (activeIcon) {
                activeIcon.style.filter = '';
            }

            // Add highlight to touched icon with its unique color
            icon.style.filter = `drop-shadow(0 0 8px ${iconColor})`;
            activeIcon = icon;

            const text = icon.getAttribute('data-text');
            updateDescriptionText(text);
        });
    });

    // Click anywhere else to reset to default text (mobile)
    document.addEventListener('click', (e) => {
        // Check if click was on an icon or within the hero area
        const clickedIcon = e.target.closest('.hero-icon');
        const clickedHero = e.target.closest('.hero');

        // If clicked outside hero area or not on an icon, reset
        if (!clickedIcon && clickedHero) {
            // Remove highlight from active icon
            if (activeIcon) {
                activeIcon.style.filter = '';
                activeIcon = null;
            }
            updateDescriptionText(defaultText);
        }
    });

    // Touch anywhere else to reset (mobile)
    document.addEventListener('touchstart', (e) => {
        const touchedIcon = e.target.closest('.hero-icon');
        const touchedHero = e.target.closest('.hero');

        if (!touchedIcon && touchedHero) {
            // Remove highlight from active icon
            if (activeIcon) {
                activeIcon.style.filter = '';
                activeIcon = null;
            }
            updateDescriptionText(defaultText);
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
    const SUPABASE_URL = 'https://api.playvoli.com';
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

    // Fetch and render Terms of Use from database
    async function loadTermsOfUse() {
        const termsContainer = document.getElementById('terms-content');
        console.log('[Terms] Container found:', !!termsContainer);
        if (!termsContainer) return;

        console.log('[Terms] Starting fetch...');
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?select=terms_of_use&limit=1`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });

            console.log('[Terms] Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Terms] API Error Response:', errorText, 'Status:', response.status);
                throw new Error(`Failed to fetch terms of use: ${response.status}`);
            }

            const data = await response.json();
            console.log('[Terms] Data received, length:', data?.length);
            if (data && data.length > 0 && data[0].terms_of_use) {
                console.log('[Terms] Rendering terms...');
                renderTermsOfUse(data[0].terms_of_use, termsContainer);
                console.log('[Terms] Render complete');
            } else {
                console.error('[Terms] No terms data found in response');
                termsContainer.innerHTML = '<p style="color: var(--text-secondary);">No terms of use available.</p>';
            }
        } catch (error) {
            console.error('[Terms] Error:', error);
            termsContainer.innerHTML = '<p style="color: var(--text-secondary);">Unable to load terms of use. Please try again later.</p>';
        }
    }

    function renderTermsOfUse(termsData, container) {
        const { header, effective_date, last_updated, sections } = termsData;

        // Update header metadata
        const effectiveDateEl = document.getElementById('terms-effective-date');
        const lastUpdatedEl = document.getElementById('terms-last-updated');
        if (effectiveDateEl) effectiveDateEl.textContent = `Effective Date: ${effective_date}`;
        if (lastUpdatedEl) lastUpdatedEl.textContent = `Last Updated: ${last_updated}`;

        let html = `<p style="margin-bottom: 2rem;">${header}</p>`;

        sections.forEach(section => {
            html += `<h2 style="color: var(--electric-blue); font-size: 1.2rem; margin: 2rem 0 1rem 0;">${section.section_number}. ${section.section_title}</h2>`;

            section.content.forEach(item => {
                if (item.subsection) {
                    html += `<p><strong>${item.subsection} ${item.title}.</strong> ${item.text}</p>`;
                } else {
                    html += `<p>${item.text}</p>`;
                }
            });
        });

        container.innerHTML = html;
    }

    // Fetch and render Privacy Policy from database
    async function loadPrivacyPolicy() {
        const privacyContainer = document.getElementById('privacy-content');
        console.log('[Privacy] Container found:', !!privacyContainer);
        if (!privacyContainer) return;

        console.log('[Privacy] Starting fetch...');
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?select=privacy_policy&limit=1`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });

            console.log('[Privacy] Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Privacy] API Error Response:', errorText, 'Status:', response.status);
                throw new Error(`Failed to fetch privacy policy: ${response.status}`);
            }

            const data = await response.json();
            console.log('[Privacy] Data received, length:', data?.length);
            if (data && data.length > 0 && data[0].privacy_policy) {
                console.log('[Privacy] Rendering privacy policy...');
                renderPrivacyPolicy(data[0].privacy_policy, privacyContainer);
                console.log('[Privacy] Render complete');
            } else {
                console.error('[Privacy] No privacy policy data found in response');
                privacyContainer.innerHTML = '<p style="color: var(--text-secondary);">No privacy policy available.</p>';
            }
        } catch (error) {
            console.error('[Privacy] Error:', error);
            privacyContainer.innerHTML = '<p style="color: var(--text-secondary);">Unable to load privacy policy. Please try again later.</p>';
        }
    }

    function renderPrivacyPolicy(privacyData, container) {
        const { header, last_updated, sections } = privacyData;

        // Update header metadata
        const lastUpdatedEl = document.getElementById('privacy-last-updated');
        if (lastUpdatedEl) lastUpdatedEl.textContent = `Last updated: ${last_updated}`;

        let html = `<div style="margin-bottom: 3rem;"><p>${header}</p></div>`;

        sections.forEach(section => {
            html += `<div style="margin-bottom: 3rem;">`;
            html += `<div style="color: var(--electric-blue); font-size: 0.8rem; font-weight: 400; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px;">${section.section_number}. ${section.section_title}</div>`;

            section.content.forEach(item => {
                if (item.title) {
                    html += `<h3 style="margin-bottom: 0.5rem; font-size: 1rem; color: var(--text-primary);">${item.title}</h3>`;
                }

                // Handle text with bullet points
                if (item.text.includes('•')) {
                    const parts = item.text.split('•');
                    if (parts[0].trim()) {
                        html += `<p>${parts[0].trim()}</p>`;
                    }
                    if (parts.length > 1) {
                        html += `<ul style="margin-bottom: 1rem; padding-left: 1.5rem; color: var(--text-secondary);">`;
                        for (let i = 1; i < parts.length; i++) {
                            html += `<li>${parts[i].trim()}</li>`;
                        }
                        html += `</ul>`;
                    }
                } else {
                    html += `<p>${item.text}</p>`;
                }
            });

            html += `</div>`;
        });

        container.innerHTML = html;
    }

    // Load appropriate content based on page
    loadTermsOfUse();
    loadPrivacyPolicy();

    // Add loading animation or any future interactive features
    console.log('Voli website loaded successfully!');
});
