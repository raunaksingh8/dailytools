import React from 'react';
import '../styles/privacy.css';

const Privacy = () => {
    return (
        <main className="privacy-page">
            <div className="privacy-container">
                <header className="privacy-header">
                    <span className="privacy-eyebrow">Legal</span>
                    <h1>Privacy Policy</h1>
                    <p>
                        Your privacy matters to us. This Privacy Policy explains how
                        DailyTools handles information when you use our website and tools.
                    </p>
                    <span className="privacy-updated">
                        Last updated: October 5, 2026
                    </span>
                </header>

                <div className="privacy-content">
                    <section>
                        <h2>1. Introduction</h2>
                        <p>
                            DailyTools provides browser-based utilities for working with
                            text, developer data, images, documents, PDFs, spreadsheets and
                            other files. This Privacy Policy explains how information may
                            be handled when you visit and use DailyTools.
                        </p>
                    </section>

                    <section>
                        <h2>2. Information You Provide</h2>
                        <p>
                            Most DailyTools utilities can be used without creating an
                            account or providing personal information.
                        </p>
                        <p>
                            Depending on the feature you use, you may voluntarily provide
                            information such as text, files or other content to process that
                            content through the selected tool.
                        </p>
                    </section>

                    <section>
                        <h2>3. Files and Content You Process</h2>
                        <p>
                            Many DailyTools tools are designed to process files and content
                            directly in your browser. When a tool operates entirely
                            client-side, the content you provide is processed on your
                            device and is not intentionally uploaded to DailyTools servers.
                        </p>
                        <p>
                            However, not every feature necessarily operates in exactly the
                            same way. You should review the behavior of the specific tool
                            before submitting sensitive or confidential information.
                        </p>
                    </section>

                    <section>
                        <h2>4. Personal Information</h2>
                        <p>
                            DailyTools does not require an account for its basic tools.
                            We do not intentionally request sensitive personal information
                            simply to use the website.
                        </p>
                        <p>
                            If you voluntarily contact us or submit a feature request,
                            information you provide in that communication may be used to
                            respond to your request.
                        </p>
                    </section>

                    <section>
                        <h2>5. Analytics and Usage Information</h2>
                        <p>
                            DailyTools may use analytics or similar technologies to
                            understand website usage, performance and tool popularity.
                            Depending on the analytics configuration, this may include
                            information such as pages visited, tools used, approximate
                            usage information, browser information and technical data.
                        </p>
                        <p>
                            Analytics information is used to improve the reliability,
                            performance and usability of DailyTools.
                        </p>
                    </section>

                    <section>
                        <h2>6. Cookies and Similar Technologies</h2>
                        <p>
                            DailyTools may use cookies, local storage or similar browser
                            technologies where necessary for website functionality,
                            preferences, analytics or other legitimate purposes.
                        </p>
                        <p>
                            You can control or remove cookies through your browser settings.
                            Disabling certain technologies may affect some website
                            functionality.
                        </p>
                    </section>

                    <section>
                        <h2>7. Third-Party Services</h2>
                        <p>
                            DailyTools may use third-party services for hosting, deployment,
                            analytics, security, infrastructure or other website
                            functionality.
                        </p>
                        <p>
                            These services may process limited technical information as
                            necessary to provide their services. Their own privacy policies
                            may also apply.
                        </p>
                    </section>

                    <section>
                        <h2>8. Data Security</h2>
                        <p>
                            We take reasonable measures to protect DailyTools and the
                            information handled through the website. However, no internet
                            service or electronic transmission can be guaranteed to be
                            completely secure.
                        </p>
                    </section>

                    <section>
                        <h2>9. Data Retention</h2>
                        <p>
                            DailyTools does not intentionally retain files or content that
                            users process through tools designed to operate entirely within
                            the browser.
                        </p>
                        <p>
                            Information submitted through other features, such as contact
                            or feature-request forms, may be retained as necessary to
                            respond to the request and operate the service.
                        </p>
                    </section>

                    <section>
                        <h2>10. Children's Privacy</h2>
                        <p>
                            DailyTools is not specifically directed toward children.
                            We do not knowingly collect personal information from children
                            for the purpose of creating user profiles or accounts.
                        </p>
                    </section>

                    <section>
                        <h2>11. Changes to This Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time as
                            DailyTools evolves or as our practices change. The updated
                            version will be published on this page with a revised
                            effective date.
                        </p>
                    </section>

                    <section>
                        <h2>12. Contact</h2>
                        <p>
                            If you have questions, concerns or requests regarding this
                            Privacy Policy, please contact us through the contact method
                            provided on the DailyTools website.
                        </p>
                    </section>

                    <div className="privacy-note">
                        <strong>Important:</strong>
                        <span>
                            This Privacy Policy is a general website policy template and
                            should be reviewed and customized according to the actual
                            analytics, hosting, cookies, storage, third-party services and
                            data-processing practices used by DailyTools.
                        </span>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Privacy;