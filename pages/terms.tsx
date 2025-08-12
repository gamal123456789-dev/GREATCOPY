import React from 'react';

export default function TermsPage() {
  return (
    <div className="antialiased">
      {/* Custom CSS for the page */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Google Fonts - Inter */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        /* Font Awesome for icons */
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

        body {
            font-family: Inter, sans-serif;
            background-color: #0d1117;
            color: #e2e8f0;
            overflow-x: hidden;
        }
        .header-bg {
            background-image: url('image_ac51dc.jpg');
            background-size: cover;
            background-position: center;
            position: relative;
            overflow: hidden;
            background-attachment: fixed;
        }
        .header-bg::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%);
            z-index: 1;
        }
        .header-content {
            position: relative;
            z-index: 3;
        }
        .glowing-lines-container {
            position: absolute;
            inset: 0;
            z-index: 2;
            pointer-events: none;
            overflow: hidden;
        }
        .glowing-line {
            position: absolute;
            width: 2px;
            height: 100%;
            background: linear-gradient(to bottom, transparent, #4f46e5, transparent);
            animation: glow-move 4s ease-in-out infinite;
        }
        .glowing-line:nth-child(1) { left: 10%; animation-delay: 0s; }
        .glowing-line:nth-child(2) { left: 30%; animation-delay: 1s; }
        .glowing-line:nth-child(3) { left: 70%; animation-delay: 2s; }
        .glowing-line:nth-child(4) { left: 90%; animation-delay: 3s; }
        @keyframes glow-move {
            0%, 100% { opacity: 0.3; transform: translateY(-20px); }
            50% { opacity: 1; transform: translateY(20px); }
        }
        .text-glow {
            text-shadow: 0 0 20px rgba(79, 70, 229, 0.6);
        }
        .content-card {
            background: linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(75, 85, 99, 0.3);
            border-radius: 1rem;
            padding: 3rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .content-card h2 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 1.5rem;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .content-card h3 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #e2e8f0;
            margin-top: 2rem;
            margin-bottom: 1rem;
            border-left: 4px solid #4f46e5;
            padding-left: 1rem;
        }
        .content-card p {
            line-height: 1.8;
            margin-bottom: 1.5rem;
            color: #d1d5db;
        }
        .content-card ul {
            margin-left: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .content-card li {
            margin-bottom: 0.75rem;
            color: #d1d5db;
            line-height: 1.7;
        }
        .last-updated {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(75, 85, 99, 0.3);
            text-align: center;
            color: #9ca3af;
        }
        .last-updated a {
            color: #4f46e5;
            text-decoration: underline;
        }
        .last-updated a:hover {
            color: #6366f1;
        }
        .cta-footer {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }
        .btn-primary {
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
      `}} />

      {/* Hero Section */}
      <header className="header-bg py-20 text-center text-white rounded-b-xl shadow-lg">
          <div className="glowing-lines-container">
              <div className="glowing-line"></div>
              <div className="glowing-line"></div>
              <div className="glowing-line"></div>
              <div className="glowing-line"></div>
          </div>
          <div className="header-content container mx-auto px-4">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight text-glow">
                  Terms of <span className="text-indigo-400">Service</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
                  Understanding our service agreement and your rights as a user.
              </p>
          </div>
      </header>

      {/* Content Section */}
      <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4 max-w-5xl">
              <div className="content-card">
                  <h2 className="text-center">Terms of Service</h2>
                  <p className="text-center text-gray-400 mb-8">Last Updated: January 25, 2025</p>

                  <h3>1. Acceptance of Terms</h3>
                  <p>By accessing or utilizing the cutting-edge services provided by Gearscore, you unequivocally agree to abide by these comprehensive Terms of Service. Should any part of this agreement not resonate with your understanding or acceptance, we respectfully advise against accessing our digital platforms or engaging with our services.</p>

                  <h3>2. Service Description</h3>
                  <p>Gearscore is at the forefront of delivering professional gaming enhancement services across a spectrum of elite online titles. Our mission is to empower users in achieving their most ambitious in-game objectives, including, but not limited to, accelerated leveling, triumphant raid completions, efficient currency acquisition, and securing rare, coveted items. Every service is meticulously executed by our cadre of highly experienced and rigorously verified gaming professionals.</p>

                  <h3>3. User Responsibilities</h3>
                  <ul>
                      <li>You must be at least 18 years of age to engage with our premium services.</li>
                      <li>The safeguarding of your account credentials and associated information is solely your responsibility.</li>
                      <li>You commit to furnishing accurate, truthful, and exhaustive information when initiating any service request.</li>
                      <li>You acknowledge that sharing account details with our dedicated boosters involves inherent risks, and while we employ state-of-the-art security protocols, your decision to proceed is at your own informed discretion.</li>
                  </ul>

                  <h3>4. Payment and Refunds</h3>
                  <p>All financial transactions for our services are processed with the utmost security through our designated, verified channels, primarily facilitated via our official Discord server. We offer full refunds if the order hasn't started yet. Once work begins on your order, refunds are subject to specific conditions outlined in our <a href='/refund-policy' className='text-blue-400 hover:text-blue-300 underline'>Refund Policy</a>. Please review our refund policy for complete details.</p>

                  <h3>5. Prohibited Conduct</h3>
                  <p>You pledge not to partake in any activities deemed unlawful, detrimental, or disruptive to the seamless operation of our services. This stricture encompasses, but is not confined to, unauthorized infiltration of our systems, dissemination of malicious software, or any form of fraudulent engagement.</p>

                  <h3>6. Disclaimer of Warranties</h3>
                  <p>Our services are provided on an "as is" basis, without any express or implied warranties whatsoever. We cannot guarantee that our services will precisely align with your unique requirements, nor can we assure uninterrupted, perfectly timed, fully secure, or entirely error-free operation.</p>

                  <h3>7. Limitation of Liability</h3>
                  <p>Gearscore shall not be held liable for any direct, indirect, incidental, special, consequential, or exemplary damages. This includes, but is not limited to, damages stemming from loss of profits, diminished goodwill, impaired use, data loss, or other intangible losses, arising from your utilization of, or inability to utilize, our specialized services.</p>

                  <h3>8. Changes to Terms</h3>
                  <p>We reserve the exclusive right to modify these Terms of Service at any given time. Your continued access to our website and sustained engagement with our services following any such modifications shall constitute your explicit acceptance of the newly revised Terms.</p>

                  <p className="last-updated">For any pressing inquiries or further elucidation regarding these terms, please do not hesitate to <a href="/contact">contact our support team</a>.</p>
              </div>
          </div>
      </section>

      {/* Call to Action Footer */}
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