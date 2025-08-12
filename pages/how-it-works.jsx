import React, { useState } from 'react';
import Head from 'next/head';

const HowItWorks = () => {
  const [selectedStep, setSelectedStep] = useState(0);

  const steps = [
    {
      title: "Create Your Account",
      icon: "fas fa-user-plus",
      description: "Sign up with Discord or email to get started",
      details: {
        title: "Getting Started",
        content: [
          "Click the 'Sign Up' button in the top navigation",
          "Choose Discord OAuth for instant setup or use email registration",
          "Complete your profile with basic information",
          "Verify your email address if using email signup"
        ]
      }
    },
    {
      title: "Browse Services",
      icon: "fas fa-search",
      description: "Explore our marketplace of digital services",
      details: {
        title: "Finding Services",
        content: [
          "Use the search bar to find specific services",
          "Filter by category, price range, and delivery time",
          "Read service descriptions and seller reviews",
          "Check seller ratings and completion history"
        ]
      }
    },
    {
      title: "Place Your Order",
      icon: "fas fa-shopping-cart",
      description: "Select a service and provide your requirements",
      details: {
        title: "Ordering Process",
        content: [
          "Click 'Order Now' on your chosen service",
          "Fill out the requirements form with detailed instructions",
          "Upload any necessary files or references",
          "Review and confirm your order details"
        ]
      }
    },
    {
      title: "Secure Payment",
      icon: "fas fa-credit-card",
      description: "Pay securely with our escrow system",
      details: {
        title: "Payment Security",
        content: [
          "Your payment is held securely in escrow",
          "Funds are only released when you approve the work",
          "Multiple payment methods accepted",
          "Full refund protection for incomplete orders"
        ]
      }
    },
    {
      title: "Track Progress",
      icon: "fas fa-tasks",
      description: "Monitor your order status in real-time",
      details: {
        title: "Order Management",
        content: [
          "Receive instant notifications for order updates",
          "Chat directly with your service provider",
          "Track milestones and delivery progress",
          "Request revisions if needed"
        ]
      }
    },
    {
      title: "Receive & Review",
      icon: "fas fa-star",
      description: "Get your completed work and leave feedback",
      details: {
        title: "Completion Process",
        content: [
          "Download your completed files",
          "Review the work against your requirements",
          "Request final revisions if necessary",
          "Leave a review to help other buyers"
        ]
      }
    }
  ];

  return (
    <>
      <Head>
        <title>How It Works - Gearscore Platform</title>
        <meta name="description" content="Learn how to use Gearscore platform step by step" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
        color: 'white',
        padding: '2rem 0'
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #58a6ff, #79c0ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            How It Works
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#8b949e',
            lineHeight: '1.6'
          }}>
            Get started with Gearscore in just a few simple steps. Our platform makes it easy to find, order, and receive high-quality digital services.
          </p>
        </div>

        {/* Steps Grid */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '4rem'
          }}>
            {steps.map((step, index) => (
              <div
                key={index}
                onClick={() => setSelectedStep(index)}
                style={{
                  background: selectedStep === index ? 'linear-gradient(135deg, #1f2937, #374151)' : '#21262d',
                  border: selectedStep === index ? '2px solid #58a6ff' : '2px solid #30363d',
                  borderRadius: '12px',
                  padding: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: selectedStep === index ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: selectedStep === index ? '0 8px 25px rgba(88, 166, 255, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: selectedStep === index ? 'linear-gradient(135deg, #58a6ff, #79c0ff)' : '#30363d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem',
                    fontSize: '1.2rem'
                  }}>
                    <i className={step.icon}></i>
                  </div>
                  <div style={{
                    background: selectedStep === index ? '#58a6ff' : '#6e7681',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {index + 1}
                  </div>
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: selectedStep === index ? '#58a6ff' : 'white'
                }}>
                  {step.title}
                </h3>
                <p style={{
                  color: '#8b949e',
                  lineHeight: '1.5'
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Details Section */}
          <div style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '12px',
            padding: '3rem',
            marginBottom: '4rem'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '600',
              marginBottom: '2rem',
              color: '#58a6ff'
            }}>
              {steps[selectedStep].details.title}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              {steps[selectedStep].details.content.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '1rem',
                  background: '#0d1117',
                  borderRadius: '8px',
                  border: '1px solid #21262d'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#58a6ff',
                    marginRight: '1rem',
                    marginTop: '0.5rem',
                    flexShrink: 0
                  }}></div>
                  <p style={{
                    color: '#e6edf3',
                    lineHeight: '1.5'
                  }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            background: 'linear-gradient(135deg, #1f2937, #374151)',
            borderRadius: '12px',
            border: '1px solid #30363d'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              Ready to Get Started?
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#8b949e',
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              Join thousands of satisfied customers who trust Gearscore for their digital service needs.
            </p>
            <button style={{
              background: 'linear-gradient(135deg, #58a6ff, #79c0ff)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              display: 'inline-block'
            }}
            onClick={() => window.location.href = '/games'}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(88, 166, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
            >
              Start Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HowItWorks;