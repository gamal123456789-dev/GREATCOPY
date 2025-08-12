import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="antialiased">
      {/* Custom CSS for the page, including external font and icon libraries */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Google Fonts - Inter */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        /* Font Awesome for icons */
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

        body {
            font-family: Inter, sans-serif; /* Changed from 'Inter' to Inter to fix hydration error */
            background-color: #0d1117; /* Deep dark background */
            color: #e2e8f0; /* Light text for contrast */
            overflow-x: hidden; /* Prevent horizontal scroll from animations */
        }
        .header-bg {
            background-image: url('image_ac51dc.jpg'); /* New gaming image */
            background-size: cover;
            background-position: center;
            position: relative;
            overflow: hidden;
            /* New: Subtle parallax effect */
            background-attachment: fixed;
        }
        .header-bg::before {
            content: '';
            position: absolute;
            inset: 0;
            /* Darker, more pronounced gradient overlay */
            background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%);
            z-index: 1;
        }
        .header-content {
            position: relative;
            z-index: 3; /* Ensure content is above all overlays */
        }

        /* New: Animated Glowing Lines/Grid */
        .glowing-lines-container {
            position: absolute;
            inset: 0;
            z-index: 2; /* Between background and content */
            pointer-events: none;
            overflow: hidden;
        }

        .glowing-line {
            position: absolute;
            background: linear-gradient(to right, transparent, rgba(99, 102, 241, 0.6), transparent); /* Indigo glow */
            height: 2px;
            opacity: 0;
            animation: glowLineHorizontal 15s infinite ease-in-out;
        }
        .glowing-line:nth-child(1) { top: 15%; left: -100%; width: 150%; animation-delay: 0s; }
        .glowing-line:nth-child(2) { top: 35%; left: -120%; width: 180%; animation-delay: 4s; background: linear-gradient(to right, transparent, rgba(167, 139, 250, 0.6), transparent); } /* Purple glow */
        .glowing-line:nth-child(3) { top: 55%; left: -80%; width: 130%; animation-delay: 8s; }
        .glowing-line:nth-child(4) { top: 75%; left: -110%; width: 160%; animation-delay: 12s; background: linear-gradient(to right, transparent, rgba(59, 130, 246, 0.6), transparent); } /* Blue glow */

        @keyframes glowLineHorizontal {
            0% { transform: translateX(0); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateX(200%); opacity: 0; }
        }

        /* New: Text Glow Animation */
        .text-glow {
            text-shadow: 0 0 10px rgba(99, 102, 241, 0.7), 0 0 20px rgba(99, 102, 241, 0.5), 0 0 30px rgba(99, 102, 241, 0.3);
            animation: pulseTextGlow 2s infinite alternate;
        }

        @keyframes pulseTextGlow {
            0% { text-shadow: 0 0 10px rgba(99, 102, 241, 0.7), 0 0 20px rgba(99, 102, 241, 0.5); }
            100% { text-shadow: 0 0 15px rgba(99, 102, 241, 0.9), 0 0 25px rgba(99, 102, 241, 0.7), 0 0 35px rgba(99, 102, 241, 0.5); }
        }

        .btn-primary {
            background-color: #6366f1; /* Indigo */
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 9999px;
            font-weight: 600;
            transition: background-color 0.2s ease-in-out, transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
            box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3); /* Subtle glow */
        }
        .btn-primary:hover {
            background-color: #4f46e5; /* Darker indigo */
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(99, 102, 241, 0.5); /* Stronger glow */
        }
        .navbar-link {
            color: #cbd5e0;
            transition: color 0.2s ease-in-out;
        }
        .navbar-link:hover {
            color: #ffffff;
        }
        .content-card {
            background-color: #1a202c; /* Dark blue-gray */
            border-radius: 1.5rem; /* rounded-3xl */
            padding: 2.5rem; /* p-10 */
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.25); /* Deeper shadow */
            border: 2px solid #3b82f6; /* Electric blue border */
            position: relative;
            overflow: hidden;
        }
        .content-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 1.5rem;
            padding: 2px; /* Border thickness */
            background: linear-gradient(45deg, #a78bfa, #6366f1, #3b82f6); /* Gradient border effect */
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none; /* Ensure clicks pass through */
        }
        .content-card h2 {
            color: #a78bfa; /* Light purple for headings */
            font-size: 2.75rem; /* Larger text-5xl */
            font-weight: 800; /* font-extrabold */
            margin-bottom: 1.5rem; /* mb-6 */
            text-shadow: 0 0 10px rgba(167, 139, 250, 0.4); /* Subtle glow */
        }
        .content-card h3 {
            color: #6366f1; /* Indigo for subheadings */
            font-size: 2rem; /* Larger text-3xl */
            font-weight: 700; /* font-bold */
            margin-top: 2.5rem; /* mt-10 */
            margin-bottom: 1.25rem; /* mb-5 */
            text-shadow: 0 0 8px rgba(99, 102, 241, 0.3); /* Subtle glow */
        }
        .content-card p {
            color: #cbd5e0;
            line-height: 1.8; /* leading-loose for better readability */
            margin-bottom: 1rem; /* mb-4 */
        }
        .content-card ul {
            list-style: none; /* Remove default bullets */
            margin-left: 0;
            padding-left: 0;
            color: #cbd5e0;
            margin-bottom: 1rem;
        }
        .content-card li {
            position: relative;
            padding-left: 1.75rem; /* Space for custom bullet */
            margin-bottom: 0.75rem; /* Increased spacing */
            line-height: 1.7;
        }
        .content-card li::before {
            content: '\\2022'; /* Unicode bullet character */
            color: #3b82f6; /* Electric blue bullet */
            font-size: 1.5rem; /* Larger bullet */
            position: absolute;
            left: 0;
            top: 0.1rem;
            font-weight: bold;
        }
        .content-card a {
            color: #818cf8; /* Light indigo for links */
            text-decoration: none; /* Remove default underline */
            border-bottom: 1px solid #818cf8; /* Custom underline */
            transition: color 0.2s ease-in-out, border-color 0.2s ease-in-out;
        }
        .content-card a:hover {
            color: #a78bfa;
            border-color: #a78bfa;
        }
        .last-updated {
            font-size: 0.95rem; /* Slightly larger text-sm */
            color: #a0aec0;
            margin-top: 2.5rem; /* mt-10 */
            text-align: right;
            font-style: italic;
        }

        /* Keyframe for subtle background animation */
        @keyframes backgroundPan {
            0% { background-position: 0% 0%; }
            50% { background-position: 100% 100%; }
            100% { background-position: 0% 0%; }
        }
        .animated-bg {
            animation: backgroundPan 60s linear infinite; /* Slow, continuous pan */
        }

        /* Simplified styles for the Call to Action Footer */
        .cta-footer {
            background: linear-gradient(135deg, #1e3a8a, #4f46e5); /* Simpler gradient */
            border: none; /* Removed border */
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3); /* Simpler shadow */
            animation: none; /* Removed pulsing glow animation */
        }

        .cta-button {
            background: linear-gradient(to right, #ffffff, #e2e8f0); /* White to light gray gradient */
            color: #4f46e5; /* Indigo text */
            padding: 1rem 2.5rem; /* Larger padding */
            border-radius: 9999px;
            font-weight: 800; /* Extra bold */
            font-size: 1.5rem; /* Larger text */
            transition: all 0.3s ease-in-out;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); /* Deeper shadow */
            border: none; /* Remove default border */
            position: relative;
            overflow: hidden;
        }
        .cta-button:hover {
            transform: translateY(-2px) scale(1.01); /* Slightly less pronounced lift and scale */
            box-shadow: 0 10px 22px rgba(0, 0, 0, 0.5); /* Slightly stronger shadow on hover */
            color: #3b82f6; /* Blue on hover */
        }
        .cta-button::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transition: width 0.4s ease-in-out, height 0.4s ease-in-out, opacity 0.4s ease-in-out;
            transform: translate(-50%, -50%);
            opacity: 0;
        }
        .cta-button:hover::before {
            width: 200%;
            height: 200%;
            opacity: 1;
        }
      `}} />

      {/* Navbar - Removed as per user request */}
      {/*
      <nav className="bg-gray-900 p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
            <a href="index.html" className="text-3xl font-bold rounded-lg px-4 py-2 tracking-wider flex items-center justify-center
                       bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg
                       transform hover:scale-105 transition duration-300">
                <i className="fas fa-cog text-white mr-3 text-4xl"></i>
                <span className="text-white">Gearscore</span>
            </a>

            <div className="hidden md:flex space-x-6 text-lg">
                <a href="index.html" className="navbar-link">Home</a>
                <a href="games.html" className="navbar-link">Games</a>
                <a href="index.html#services" className="navbar-link">Services</a>
                <a href="index.html#how-it-works" className="navbar-link">How It Works</a>
                <a href="faq.html" className="navbar-link">FAQ</a>
                <a href="contact_us_new_design.html" className="navbar-link">Contact Us</a>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative">
                    <select className="bg-gray-800 text-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" defaultValue="en">
                        <option value="en">English</option>
                        <option value="ar">Arabic</option>
                    </select>
                </div>
                <button className="md:hidden text-gray-400 focus:outline-none">
                    <i className="fas fa-bars text-2xl"></i>
                </button>
            </div>
        </div>
      </nav>
      */}

      {/* Hero Section for Terms & Privacy Page - RE-DESIGNED */}
      <header className="header-bg py-20 text-center text-white rounded-b-xl shadow-lg">
          {/* New: Animated Glowing Lines/Grid Container */}
          <div className="glowing-lines-container">
              <div className="glowing-line"></div>
              <div className="glowing-line"></div>
              <div className="glowing-line"></div>
              <div className="glowing-line"></div>
          </div>
          <div className="header-content container mx-auto px-4">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight text-glow">
                  Privacy <span className="text-indigo-400">Policy</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
                  Understanding how we protect and handle your personal information.
              </p>
          </div>
      </header>

      {/* Content Section: Terms of Service & Privacy Policy */}
      <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4 max-w-5xl">
              <div className="content-card">
                  <h2 className="text-center">Privacy Policy</h2>
                  <p className="text-center text-gray-400 mb-8">Last Updated: January 25, 2025</p>

                  <h3>1. Information We Collect</h3>
                  <p>In connection with the high-caliber services we provide, we meticulously collect various categories of information, including:</p>
                  <ul>
                      <li><strong>Personal Information:</strong> This encompasses data such as your full name, email address, and essential payment details. This information is primarily gathered when you place an order or initiate contact with our support team.</li>
                      <li><strong>Gaming Account Information:</strong> For services requiring direct in-game action (piloted services), we will necessitate your game account login credentials. This sensitive information is handled with the utmost discretion, confidentiality, and adherence to stringent security protocols.</li>
                      <li><strong>Usage Data:</strong> This refers to analytical information pertaining to how our service is accessed and utilized. It may include technical details such as your IP address, browser type, and operating system, used for service optimization and security.</li>
                  </ul>

                  <h3>2. How We Use Your Information</h3>
                  <p>The information we collect is strategically employed for a multitude of purposes, including:</p>
                  <ul>
                      <li>To seamlessly provide and meticulously maintain the integrity of our services.</li>
                      <li>To efficiently process your orders and execute financial transactions.</li>
                      <li>To facilitate clear and timely communication with you regarding your service requests and crucial updates.</li>
                      <li>To continuously enhance and refine the functionality and user experience of our website and services.</li>
                      <li>To proactively detect, prevent, and effectively address any technical anomalies or security concerns.</li>
                      <li>To ensure full compliance with all applicable legal and regulatory obligations.</li>
                  </ul>

                  <h3>3. Data Security</h3>
                  <p>The security of your invaluable data stands as our paramount concern. We rigorously implement a diverse array of cutting-edge security measures, including robust encryption protocols and secure access methodologies, to comprehensively safeguard your personal and gaming account information against any form of unauthorized access, illicit alteration, unwarranted disclosure, or destructive acts. Furthermore, our elite boosters consistently utilize Virtual Private Networks (VPNs) to provide an additional, impenetrable layer of security during all piloted service engagements.</p>

                  <h3>4. Sharing Your Information</h3>
                  <p>We maintain an unwavering commitment to never sell, trade, or otherwise transfer your personally identifiable information to external, unauthorized parties. This policy does not, however, extend to trusted third-party entities who are instrumental in assisting us with the operation of our website, the conduct of our business, or the delivery of services to you, provided that these parties are contractually bound to uphold the strict confidentiality of this information.</p>

                  <h3>5. Your Data Protection Rights</h3>
                  <p>Depending on your geographical location and applicable legal frameworks, you may possess the following fundamental data protection rights:</p>
                  <ul>
                      <li>The inherent right to access, update, or request the deletion of any information we hold concerning you.</li>
                      <li>The right to demand the rectification of any inaccurate or incomplete information.</li>
                      <li>The right to object to our continued processing of your personal data.</li>
                      <li>The right to request the restriction of processing activities pertaining to your personal data.</li>
                      <li>The right to data portability, allowing you to obtain and reuse your personal data across different services.</li>
                      <li>The absolute right to withdraw any previously granted consent at any time, particularly in instances where Gearscore's processing of your personal information was predicated upon such consent.</li>
                  </ul>

                  <h3>6. Cookies</h3>
                  <p>We may strategically employ cookies and analogous tracking technologies to diligently monitor activity on our service and to retain specific pieces of information. Cookies are diminutive files containing a small quantum of data, which may encompass an anonymous, unique identifier. You retain the prerogative to configure your web browser to outright refuse all cookies or to provide an alert whenever a cookie is being transmitted.</p>

                  <h3>7. Changes to This Privacy Policy</h3>
                  <p>Our Privacy Policy may undergo periodic updates to reflect evolving practices or legal requirements. We commit to notifying you of any significant alterations by prominently publishing the revised Privacy Policy on this dedicated page. We strongly advise you to periodically review this Privacy Policy to remain fully informed of any changes.</p>

                  <p className="last-updated">For any pressing inquiries or further elucidation regarding these essential policies, please do not hesitate to <a href="/contact">contact our support team</a>.</p>
              </div>
          </div>
      </section>

      {/* Call to Action Footer - SIMPLIFIED DESIGN */}
      <section className="cta-footer text-white py-12 text-center rounded-t-xl mx-auto max-w-7xl mt-12 shadow-xl">
          <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold mb-4">Ready to Elevate Your Game?</h2>
              <p className="text-xl mb-8">Join our elite community and let Gearscore unleash your full potential.</p>
              <a href="https://discord.gg/s88WnxvG" target="_blank" className="btn-primary inline-block bg-white text-indigo-700 hover:bg-gray-200 text-xl py-3 px-8">
                  Join Our Discord Server <i className="fab fa-discord ml-2"></i>
              </a>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10 text-gray-400 text-sm">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                  <h3 className="text-lg font-bold text-white mb-4">Gearscore</h3>
                  <p>Your gateway to professional gaming boosting services. We aim to provide the best experience for gamers.</p>
              </div>
              <div>
                  <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                  <ul>
                      <li className="mb-2"><a href="/" className="hover:text-white">Home</a></li>
                      <li className="mb-2"><a href="/games" className="hover:text-white">Games</a></li>
                      <li className="mb-2"><a href="/#services" className="hover:text-white">Services</a></li>
                      <li className="mb-2"><a href="/#about" className="hover:text-white">About Us</a></li>
                  </ul>
              </div>
              <div>
                  <h3 className="text-lg font-bold text-white mb-4">Support</h3>
                  <ul>
                      <li className="mb-2"><a href="/faq" className="hover:text-white">FAQ</a></li>
                      <li className="mb-2"><a href="/contact" className="hover:text-white">Contact Us</a></li>
                      <li className="mb-2"><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                      <li className="mb-2"><a href="/refund-policy" className="hover:text-white">Refund Policy</a></li>
                      <li className="mb-2"><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                  </ul>
              </div>
              <div>
                  <h3 className="text-lg font-bold text-white mb-4">Follow Us</h3>
                  <div className="flex space-x-4 text-2xl mb-4">
                      <a href="https://www.instagram.com/gearscoreboosting/" target="_blank" className="hover:text-white transition-colors duration-300"><i className="fab fa-instagram"></i></a>
                      <a href="https://discord.gg/s88WnxvG" target="_blank" className="hover:text-white transition-colors duration-300"><i className="fab fa-discord"></i></a>
                  </div>
                  <div className="mt-4">
                      <h4 className="text-md font-semibold text-white mb-2">Contact</h4>
                      <p className="text-gray-400">support@gear-score.com</p>
                  </div>
              </div>
          </div>
          <div className="text-center mt-10 border-t border-gray-700 pt-8">
              {/* Logo */}
              <div className="mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                      <i className="fas fa-cog text-white text-3xl"></i>
                      <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text text-2xl font-bold">Gearscore</span>
                  </div>
              </div>
              <p>&copy; 2025 Gearscore. All rights reserved.</p>
          </div>
      </footer>
    </div>
  );
}
