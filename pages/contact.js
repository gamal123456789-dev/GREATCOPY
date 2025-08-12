import React, { useState, useEffect } from 'react';

function ContactUsPage() {
    // State to manage active tab: 'liveChat' or 'submitTicket'
    const [activeTab, setActiveTab] = useState('liveChat');
    // State for form fields
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketPriority, setTicketPriority] = useState('Medium'); // Default priority
    const [ticketDescription, setTicketDescription] = useState('');
    const [ticketName, setTicketName] = useState('');
    const [ticketEmail, setTicketEmail] = useState('');

    // State for custom message box
    const [messageBox, setMessageBox] = useState({ show: false, type: '', message: '' });

    // Function to show message box
    const showMessageBox = (type, message) => {
        setMessageBox({ show: true, type, message });
    };

    // Function to hide message box
    const hideMessageBox = () => {
        setMessageBox({ show: false, type: '', message: '' });
    };

    // Function to handle tab switching
    const openTab = (tabName) => {
        setActiveTab(tabName);
    };

    // Handle form submission - Send ticket to Tawk.to via API
    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        
        // Show loading state
        showMessageBox('info', 'Sending your ticket...');
        
        try {
            const response = await fetch('/api/send-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: ticketName,
                    email: ticketEmail,
                    subject: ticketSubject,
                    priority: ticketPriority,
                    description: ticketDescription
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessageBox('success', 'Your ticket has been sent successfully to our support team. We will get back to you soon!');
                
                // Clear the form
                setTicketName('');
                setTicketEmail('');
                setTicketSubject('');
                setTicketPriority('Medium');
                setTicketDescription('');
            } else {
                showMessageBox('error', result.message || 'Failed to send ticket. Please try again.');
            }
        } catch (error) {
            console.error('Error sending ticket:', error);
            showMessageBox('error', 'Network error. Please check your connection and try again.');
        }
    };

    return (
        <div className="antialiased">
            {/* Custom CSS for the page - Using dangerouslySetInnerHTML to fix hydration error */}
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
                .tab-button {
                    background-color: #2d3748;
                    color: #cbd5e0;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    z-index: 1;
                }
                .tab-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
                    transition: left 0.3s ease-in-out;
                    z-index: -1;
                }
                .tab-button:hover::before {
                    left: 0;
                }
                .tab-button.active {
                    background: linear-gradient(to right, #6366f1, #a78bfa); /* Gradient for active tab */
                    color: white;
                    box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
                }
                .tab-content {
                    display: none;
                }
                .tab-content.active {
                    display: block;
                }
                .content-card-main {
                    background-color: #1a202c; /* Dark blue-gray */
                    border-radius: 1.5rem; /* rounded-3xl */
                    padding: 2.5rem; /* p-10 */
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.25); /* Deeper shadow */
                    border: 2px solid #3b82f6; /* Electric blue border */
                    position: relative;
                    overflow: hidden;
                }
                .content-card-main::before {
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
                .feature-card {
                    background-color: #1a202c; /* Dark blue-gray */
                    border-radius: 1.5rem; /* rounded-3xl */
                    padding: 2.5rem; /* p-10 */
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.25); /* Deeper shadow */
                    border: 2px solid #3b82f6; /* Electric blue border */
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
                }
                .feature-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7), 0 8px 20px rgba(0, 0, 0, 0.4);
                }
                .feature-card::before {
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

            {/* Custom Message Box */}
            {messageBox.show && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className={`bg-gray-800 p-8 rounded-xl shadow-lg border-t-4 ${messageBox.type === 'success' ? 'border-green-500' : 'border-red-500'} text-center max-w-sm mx-auto`}>
                        <p className={`text-xl font-semibold mb-4 ${messageBox.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {messageBox.type === 'success' ? 'Success!' : 'Error!'}
                        </p>
                        <p className="text-gray-200 mb-6">{messageBox.message}</p>
                        <button
                            onClick={hideMessageBox}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Hero Section for Contact Page - RE-DESIGNED */}
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
                        Get In <span className="text-indigo-400">Touch</span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
                        We're here to help you with any questions or support you need!
                    </p>
                </div>
            </header>

            {/* Contact Section - Based on provided image */}
            <section className="py-16 bg-gray-900">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="content-card-main">
                        {/* Tab Buttons */}
                        <div className="flex justify-center space-x-4 mb-8">
                            <button
                                className={`tab-button ${activeTab === 'liveChat' ? 'active' : ''} text-lg py-3 px-6 rounded-full`}
                                onClick={() => openTab('liveChat')}
                            >
                                <i className="fas fa-comments mr-2"></i>Live Chat
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'submitTicket' ? 'active' : ''} text-lg py-3 px-6 rounded-full`}
                                onClick={() => openTab('submitTicket')}
                            >
                                <i className="fas fa-envelope-open-text mr-2"></i>Submit Ticket
                            </button>
                        </div>

                        {/* Live Chat Tab Content */}
                        <div id="liveChat" className={`tab-content ${activeTab === 'liveChat' ? 'active' : ''} text-center`}>
                            <div className="bg-gray-800 rounded-xl p-8 flex flex-col items-center justify-center border border-gray-700 shadow-inner">
                                <i className="fas fa-headset text-indigo-400 text-7xl mb-6 animate-pulse"></i>
                                <h3 className="text-3xl font-bold text-white mb-3">Live Chat Support</h3>
                                <p className="text-gray-300 text-lg mb-4">Connect with our support team instantly for immediate assistance.</p>
                                <p className="text-green-500 font-semibold text-xl mb-6">
                                    Support team is online
                                </p>
                                <button 
                                    onClick={() => {
                                        // Open Tawk.to chat widget
                                        if (window.Tawk_API && window.Tawk_API.maximize) {
                                            window.Tawk_API.maximize();
                                        } else {
                                            // Fallback: try to trigger Tawk.to widget
                                            const tawkWidget = document.querySelector('#tawkto-chat-widget, .tawk-widget, [id*="tawk"]');
                                            if (tawkWidget) {
                                                tawkWidget.click();
                                            } else {
                                                alert('Live chat is loading... Please wait a moment and try again.');
                                            }
                                        }
                                    }}
                                    className="btn-primary text-xl py-3 px-8 inline-block cursor-pointer"
                                >
                                    Start Live Chat <i className="fas fa-comments ml-2"></i>
                                </button>
                            </div>
                        </div>

                        {/* Submit Ticket Tab Content */}
                        <div id="submitTicket" className={`tab-content ${activeTab === 'submitTicket' ? 'active' : ''} text-center`}>
                            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-inner">
                                <h3 className="text-3xl font-bold text-white mb-6">Submit a Support Ticket</h3>
                                <form onSubmit={handleSubmitTicket} className="space-y-6">
                                    <div>
                                        <label htmlFor="ticketName" className="block text-gray-300 text-sm font-bold mb-2 text-left">Your Name</label>
                                        <input
                                            type="text"
                                            id="ticketName"
                                            name="ticketName"
                                            className="shadow-sm border border-gray-600 rounded-lg w-full py-4 px-5 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                                            placeholder="John Doe"
                                            value={ticketName}
                                            onChange={(e) => setTicketName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="ticketEmail" className="block text-gray-300 text-sm font-bold mb-2 text-left">Your Email</label>
                                        <input
                                            type="email"
                                            id="ticketEmail"
                                            name="ticketEmail"
                                            className="shadow-sm border border-gray-600 rounded-lg w-full py-4 px-5 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                                            placeholder="your.email@example.com"
                                            value={ticketEmail}
                                            onChange={(e) => setTicketEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="ticketSubject" className="block text-gray-300 text-sm font-bold mb-2 text-left">Subject</label>
                                        <input
                                            type="text"
                                            id="ticketSubject"
                                            name="ticketSubject"
                                            className="shadow-sm border border-gray-600 rounded-lg w-full py-4 px-5 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                                            placeholder="Brief description of your issue"
                                            value={ticketSubject}
                                            onChange={(e) => setTicketSubject(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="ticketPriority" className="block text-gray-300 text-sm font-bold mb-2 text-left">Priority</label>
                                        <select
                                            id="ticketPriority"
                                            name="ticketPriority"
                                            className="shadow-sm border border-gray-600 rounded-lg w-full py-4 px-5 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                                            value={ticketPriority}
                                            onChange={(e) => setTicketPriority(e.target.value)}
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                            <option value="Urgent">Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="ticketDescription" className="block text-gray-300 text-sm font-bold mb-2 text-left">Message</label>
                                        <textarea
                                            id="ticketDescription"
                                            name="ticketDescription"
                                            rows="6"
                                            className="shadow-sm border border-gray-600 rounded-lg w-full py-4 px-5 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                                            placeholder="Please provide detailed information about your issue..."
                                            value={ticketDescription}
                                            onChange={(e) => setTicketDescription(e.target.value)}
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <button type="submit" className="btn-primary text-xl px-7 py-4 rounded-lg">
                                            Submit Ticket <i className="fas fa-paper-plane ml-2"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Feature Cards Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                        <div className="feature-card text-center">
                            <div className="text-indigo-400 text-6xl mb-4"><i className="fas fa-comments"></i></div>
                            <h3 className="text-2xl font-bold text-white mb-3">Live Chat</h3>
                            <p className="text-gray-300">Instant support available 24/7 through our live chat widget.</p>
                        </div>

                        <div className="feature-card text-center">
                            <div className="text-indigo-400 text-6xl mb-4"><i className="fas fa-clock"></i></div>
                            <h3 className="text-2xl font-bold text-white mb-3">Fast Response</h3>
                            <p className="text-gray-300">Average response time under 5 minutes for immediate assistance.</p>
                        </div>

                        <div className="feature-card text-center">
                            <div className="text-indigo-400 text-6xl mb-4"><i className="fas fa-ticket-alt"></i></div>
                            <h3 className="text-2xl font-bold text-white mb-3">Ticket System</h3>
                            <p className="text-gray-300">Track your issues and get updates on your support requests.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Footer */}
            <section className="cta-footer text-white py-12 text-center rounded-t-xl mx-auto max-w-7xl mt-12 shadow-xl">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
                    <p className="text-xl mb-8">Let Gearscore elevate your gaming experience to a new level.</p>
                    <a href="https://discord.gg/s88WnxvG" target="_blank" className="cta-button inline-block">
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

export default ContactUsPage;
