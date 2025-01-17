/* eslint-disable react/no-unknown-property */
import React from 'react';

import './icons.pcss';

export const Icons = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="hidden">
        <symbol
            id="sidebar-burger"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 12H20" />
            <path d="M4 7H20" />
            <path d="M4 17H20" />
        </symbol>

        <symbol id="cross" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6.43 6.43 17.6 17.6m-11.17-.03L17.6 6.4" />
        </symbol>

        <symbol id="star" viewBox="0 0 30 30" fill="currentColor" fillRule="evenodd" clipRule="evenodd">
            <path d="m15 21-8.8 6.1 3-10.2-8.5-6.5 10.8-.3L15 0l3.5 10.1 10.8.3-8.6 6.5L23.8 27l-8.8-6Z" />
        </symbol>

        <symbol
            id="arrow-down"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 10L12 16L18 10" />
        </symbol>

        <symbol
            id="tick"
            viewBox="0 0 24 24"
            fill="none"
            fillRule="evenodd"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m5 12 6 6 8-9" />
        </symbol>

        <symbol id="plus" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 12H20" />
            <path d="M12 4L12 20" />
        </symbol>

        <symbol
            id="basket"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7 9h10l-.76 10.08a1 1 0 0 1-1 .92H8.76a1 1 0 0 1-1-.92L7 9ZM6 6.5h12M14 6V4h-4v2M13.5 12v5-5Zm-3 0v5-5Z" />
        </symbol>

        <symbol
            id="edit"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 20.5h15.983M10.778 16.435l-4.242-4.243 7.07-7.07a3 3 0 0 1 4.243 0 3 3 0 0 1 0 4.242l-7.07 7.071ZM5.121 17.85l1.415-5.658 4.242 4.243-5.657 1.414ZM16.789 9.01 13.96 6.182" />
        </symbol>

        <symbol id="question" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11.01 13.92c0-.63.08-1.13.23-1.5.15-.38.42-.74.83-1.1.4-.36.67-.66.8-.88s.2-.47.2-.72c0-.76-.35-1.13-1.04-1.13-.33 0-.6.1-.79.3-.2.2-.3.49-.3.85H9c0-.86.28-1.53.82-2.01A3.19 3.19 0 0 1 12.03 7c.94 0 1.67.23 2.2.69.51.46.77 1.1.77 1.94 0 .39-.08.74-.25 1.08-.17.34-.47.72-.89 1.13l-.54.52c-.34.32-.53.7-.58 1.15l-.02.4zm-.2 2.06c0-.3.1-.55.31-.74.2-.2.46-.3.78-.3s.57.1.77.3c.2.2.3.44.3.74s-.1.54-.3.73c-.19.2-.45.29-.77.29-.33 0-.59-.1-.79-.29a.98.98 0 0 1-.3-.73z" fill="currentColor" />
        </symbol>

        <symbol
            id="bug"
            viewBox="0 0 24 24"
            fill="none"
            fillRule="evenodd"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
        >
            <path d="M12 5a6 6 0 0 1 6 6v4a6 6 0 1 1-12 0v-4a6 6 0 0 1 6-6zm6 5h3m-6.25-5 1.5-2m-6.5 2-1.5-2M2.5 10h3M18 14h3M2.5 14h3m12 4H21M2.5 18h4m0-6.5h11" />
        </symbol>

        <symbol
            id="send-feedback"
            viewBox="0 0 24 24"
            fill="none"
            fillRule="evenodd"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
        >
            <path d="M13 12H7l-3 8 17-8L4 4l3 8z" />
        </symbol>

        <symbol
            id="checkbox-disabled"
            viewBox="0 0 24 24"
            fill="none"
            fillRule="evenodd"
            clipRule="evenodd"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 3H3V21H21V3Z" />
        </symbol>

        <symbol id="checkbox-enabled" viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" clipRule="evenodd">
            <path d="M22 22V2H2v20h20ZM17.57 9.49a.75.75 0 1 0-1.14-.98l-5.48 6.38-3.41-3.49a.75.75 0 0 0-1.08 1.05l4.57 4.66 6.54-7.62Z" />
        </symbol>

        <symbol id="checkbox-partly-enabled" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 3H3V21H21V3Z" fillRule="evenodd" clipRule="evenodd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="9.5" y="9.5" width="5" height="5" strokeWidth="5" strokeLinejoin="miter" />
        </symbol>

        <symbol id="checkmark" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10.6" fill="currentColor" />
            <path d="M17.24 7.84c.37.32.4.87.09 1.23l-6.09 7a.87.87 0 0 1-1.3.03L6.7 12.68a.87.87 0 0 1 1.27-1.2l2.58 2.72 5.46-6.27a.88.88 0 0 1 1.23-.09Z" fill="white" fillRule="evenodd" clipRule="evenodd" />
        </symbol>

        <symbol
            id="external-link"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18.5 11.83V6h-5.71M18.42 6.04l-6.79 6.93M9.27 7H8.5a2 2 0 0 0-2 2v7c0 1.1.9 2 2 2h7a2 2 0 0 0 2-2v-.7" />
        </symbol>

        <symbol
            id="pencil"
            viewBox="0 0 16 16"
            fill="none"
            fillRule="evenodd"
            clipRule="evenodd"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7.19 10.96 4.36 8.13 9.07 3.4a2 2 0 0 1 2.83 2.83l-4.71 4.72Z" />
            <path d="m3.41 11.9.95-3.77 2.83 2.83-3.78.94ZM11.2 6 9.3 4.13" />
        </symbol>

        <symbol
            id="globe"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
            <path d="M14.5 3.5c.27 1.17.5 2.33.65 3.5M19 7c-1.25.36-2.5.62-3.75.78a36.4 36.4 0 0 1 0 8.44c1.25.16 2.5.42 3.75.78M15.15 17a38.06 38.06 0 0 1-.65 3.5M9.5 20.5c-.27-1.17-.5-2.33-.65-3.5M5 17c1.25-.36 2.5-.62 3.75-.78a36.18 36.18 0 0 1 0-8.44C7.5 7.62 6.25 7.36 5 7M8.85 7c.16-1.17.38-2.33.65-3.5M9.5 16.13a24.61 24.61 0 0 1 5 0M14.5 7.87a24.61 24.61 0 0 1-5 0M3 12h18" />
        </symbol>

        <symbol
            id="spinner"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6.29 5.04c.11-.1.23-.18.35-.27M8.56 3.68a8.93 8.93 0 0 1 1.24-.4M12 3a9 9 0 1 1-8.32 12.44" />
        </symbol>
    </svg>
);
