import React, { useState } from 'react';
import '../styles/request-feature.css';

const MAX_MESSAGE_LENGTH = 300;

const RequestFeature = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
    });

    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'message' && value.length > MAX_MESSAGE_LENGTH) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (submitted) {
            setSubmitted(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Backend/API will be connected later.
        setSubmitted(true);
    };

    return (
        <div className="request-feature-page">
            <div className="request-feature-container">

                <div className="request-feature-header">
                    <div className="request-feature-icon" aria-hidden="true">
                        <svg
                            viewBox="0 0 24 24"
                            width="22"
                            height="22"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                        </svg>
                    </div>

                    <h1>Request a Feature</h1>

                    <p>
                        Have an idea for a tool or feature you'd like to see on DailyTools?
                        Tell us what would make your workflow easier.
                    </p>
                </div>

                <div className="request-feature-card">
                    <form onSubmit={handleSubmit}>

                        <div className="request-form-row">
                            <div className="request-form-group">
                                <label htmlFor="feature-name">
                                    Name <span>*</span>
                                </label>

                                <input
                                    id="feature-name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your name"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="request-form-group">
                                <label htmlFor="feature-email">
                                    Email <span>*</span>
                                </label>

                                <input
                                    id="feature-email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    maxLength={150}
                                    required
                                />
                            </div>
                        </div>

                        <div className="request-form-group">
                            <label htmlFor="feature-phone">
                                Phone Number <small>(Optional)</small>
                            </label>

                            <input
                                id="feature-phone"
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter your phone number"
                                maxLength={20}
                            />
                        </div>

                        <div className="request-form-group">
                            <div className="request-message-label">
                                <label htmlFor="feature-message">
                                    Feature Request <span>*</span>
                                </label>

                                <span className="request-character-count">
                                    {formData.message.length}/{MAX_MESSAGE_LENGTH}
                                </span>
                            </div>

                            <textarea
                                id="feature-message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Describe the tool or feature you'd like us to add..."
                                maxLength={MAX_MESSAGE_LENGTH}
                                rows={7}
                                required
                            />
                        </div>

                        {submitted && (
                            <div className="request-form-notice">
                                <svg
                                    viewBox="0 0 24 24"
                                    width="18"
                                    height="18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>

                                <span>
                                    Your request is ready to be submitted. Backend submission
                                    will be connected soon.
                                </span>
                            </div>
                        )}

                        <div className="request-form-footer">
                            <p>
                                Your feedback helps us decide what to build next.
                            </p>

                            <button type="submit" className="request-submit-button">
                                <span>Send Request</span>

                                <svg
                                    viewBox="0 0 24 24"
                                    width="17"
                                    height="17"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="m22 2-7 20-4-9-9-4Z" />
                                    <path d="M22 2 11 13" />
                                </svg>
                            </button>
                        </div>

                    </form>
                </div>

                <p className="request-feature-note">
                    Please don't include passwords, payment information, or other
                    sensitive information in your request.
                </p>

            </div>
        </div>
    );
};

export default RequestFeature;