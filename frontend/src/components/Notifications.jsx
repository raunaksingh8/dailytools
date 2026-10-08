import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/notification.css';


import { API_URL } from '../config/api';

const Notifications = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    const notificationRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            setHasError(false);

            const response = await fetch(
                `${API_URL}/api/get-updates`
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Failed to fetch updates'
                );
            }

            setNotifications(result.data || []);

        } catch (error) {
            console.error('Notification fetch error:', error);
            setHasError(true);
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener(
                'mousedown',
                handleOutsideClick
            );
            document.removeEventListener(
                'keydown',
                handleEscape
            );
        };
    }, []);

    const handleToggle = () => {
        setIsOpen((previous) => !previous);
    };

    const getNotificationIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'feature':
                return (
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M12 3v18M3 12h18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <path
                            d="M7 7l5-4 5 4-5 4-5-4Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                        />
                    </svg>
                );

            case 'bug':
            case 'fix':
                return (
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M8 9h8v6a4 4 0 0 1-8 0V9Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                        />
                        <path
                            d="M9 9V7a3 3 0 0 1 6 0v2M5 11h3M16 11h3M5 15h3M16 15h3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>
                );

            case 'announcement':
                return (
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M4 10v4a2 2 0 0 0 2 2h2l2 4h2l-1.5-4H13l5 3V5l-5 3H6a2 2 0 0 0-2 2Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                        />
                    </svg>
                );

            default:
                return (
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                        />
                        <path
                            d="M12 8v4l2.5 2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                );
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const now = new Date();
        const difference = now.getTime() - date.getTime();

        const seconds = Math.floor(difference / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) {
            return 'Just now';
        }

        if (minutes < 60) {
            return `${minutes}m ago`;
        }

        if (hours < 24) {
            return `${hours}h ago`;
        }

        if (days < 7) {
            return `${days}d ago`;
        }

        return date.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const renderNotification = (notification) => {
        const {
            id,
            title,
            message,
            type,
            link,
            created_at
        } = notification;

        const content = (
            <>
                <div className="notification-item-icon">
                    {getNotificationIcon(type)}
                </div>

                <div className="notification-item-content">
                    <div className="notification-item-top">
                        <h4>{title}</h4>

                        <span className="notification-time">
                            {formatTime(created_at)}
                        </span>
                    </div>

                    <p>{message}</p>
                </div>
            </>
        );

        if (link) {
            return (
                <Link
                    key={id}
                    to={link}
                    className="notification-item"
                    onClick={() => setIsOpen(false)}
                >
                    {content}
                </Link>
            );
        }

        return (
            <div
                key={id}
                className="notification-item notification-item-static"
            >
                {content}
            </div>
        );
    };

    const hasNotifications = notifications.length > 0;

    return (
        <div
            className="notifications-wrapper"
            ref={notificationRef}
        >
            <button
                type="button"
                className={`notifications-trigger ${isOpen ? 'notifications-trigger-active' : ''
                    }`}
                onClick={handleToggle}
                aria-label="Notifications"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <svg
                    className="notification-bell-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>

                {hasNotifications && (
                    <span
                        className="notification-unread-wave"
                        aria-label={`${notifications.length} new ${notifications.length === 1 ? 'update' : 'updates'
                            }`}
                    >
                        <span className="notification-unread-wave-ring ring-one" />
                        <span className="notification-unread-wave-ring ring-two" />
                        <span className="notification-unread-wave-ring ring-three" />

                        <span className="notification-unread-count">
                            {notifications.length > 9 ? '9+' : notifications.length}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notifications-dropdown">
                    <div className="notifications-header">
                        <div>
                            <h3>Updates</h3>
                            <p>
                                Latest News and Updates from Developer
                            </p>
                        </div>

                        <button
                            type="button"
                            className="notifications-refresh"
                            onClick={fetchNotifications}
                            disabled={isLoading}
                            aria-label="Refresh updates"
                            title="Refresh updates"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                className={
                                    isLoading
                                        ? 'notification-refresh-spinning'
                                        : ''
                                }
                            >
                                <path
                                    d="M20 11a8 8 0 0 0-14.9-4M4 5v5h5M4 13a8 8 0 0 0 14.9 4M20 19v-5h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="notifications-body">

                        {isLoading && (
                            <div className="notifications-state">
                                <div className="notification-loader" />
                                <span>Loading updates...</span>
                            </div>
                        )}

                        {!isLoading && hasError && (
                            <div className="notifications-state notifications-error">
                                <div className="notifications-state-icon">
                                    !
                                </div>

                                <strong>
                                    Couldn't load updates
                                </strong>

                                <span>
                                    Please try again.
                                </span>

                                <button
                                    type="button"
                                    onClick={fetchNotifications}
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {!isLoading &&
                            !hasError &&
                            !hasNotifications && (
                                <div className="notifications-state">
                                    <div className="notifications-empty-icon">
                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>

                                    <strong>
                                        You're all caught up
                                    </strong>

                                    <span>
                                        No new updates from DailyTools.
                                    </span>
                                </div>
                            )}

                        {!isLoading &&
                            !hasError &&
                            hasNotifications && (
                                <div className="notifications-list">
                                    {notifications.map(
                                        renderNotification
                                    )}
                                </div>
                            )}

                    </div>

                    {hasNotifications && (
                        <div className="notifications-footer">
                            <span>
                                {notifications.length}{' '}
                                {notifications.length === 1
                                    ? 'update'
                                    : 'updates'}
                            </span>

                            <span className="notifications-footer-dot">
                                •
                            </span>

                            <span>Latest first</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notifications;