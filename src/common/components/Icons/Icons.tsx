import React, { type ReactElement } from 'react';

export const Icons = (): ReactElement => (
    <svg xmlns="http://www.w3.org/2000/svg" className="hidden">
        {/* Options page icons */}
        <symbol id="star" viewBox="0 0 30 30" fill="currentColor" fillRule="evenodd" clipRule="evenodd">
            <path d="m15 21-8.8 6.1 3-10.2-8.5-6.5 10.8-.3L15 0l3.5 10.1 10.8.3-8.6 6.5L23.8 27l-8.8-6Z" />
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

        {/* Popup icons */}
        <symbol id="gift" viewBox="0 0 24 24" width="24" height="24">
            <rect x="5" y="10" width="14" height="11" stroke="#74A352" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <rect x="-0.75" y="0.75" width="17.5" height="2.5" transform="matrix(1 0 0 -1 4 10.5)" stroke="#74A352" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <path d="M12 6.14273C12.8741 4.55946 14.9219 1.62639 16.6002 3.73742C18.2784 5.84844 14.2726 6.31865 12 6.14273Z" stroke="#74A352" strokeWidth="1.5" fill="none" />
            <path d="M11.8911 6.65113C11.0361 4.94529 9.03282 1.78516 7.39111 4.05961C5.74941 6.33406 9.66797 6.84067 11.8911 6.65113Z" stroke="#74A352" strokeWidth="1.5" fill="none" />
        </symbol>

        <symbol id="bookmark-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v12.59a1 1 0 0 1-1.7.7l-2.6-2.58a1 1 0 0 0-1.4 0l-2.6 2.58a1 1 0 0 1-1.7-.7V6Z" />
        </symbol>

        <symbol id="bookmark-off-thin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M7 6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v12.59a1 1 0 0 1-1.7.7l-2.6-2.58a1 1 0 0 0-1.4 0l-2.6 2.58a1 1 0 0 1-1.7-.7V6Z" />
        </symbol>

        <symbol id="bookmark-on" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v12.59a1 1 0 0 1-1.7.7l-2.6-2.58a1 1 0 0 0-1.4 0l-2.6 2.58a1 1 0 0 1-1.7-.7V6Z" />
        </symbol>

        <symbol id="play" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="4" stroke="#74A352" strokeWidth="1.5" />
            <path fillRule="evenodd" clipRule="evenodd" d="M10.6665 7.99992L6.6665 10.6666L6.6665 5.33325L10.6665 7.99992Z" stroke="#74A352" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>

        {/* TODO: there is star icon in popup, maybe worth refactoring */}
        <symbol
            id="star-rounded"
            width="32"
            height="29"
            viewBox="0 0 32 29"
            fillRule="evenodd"
            clipRule="evenodd"
            fill="currentColor"
        >
            <path d="M16.1324 24L6.72787 28.9443L8.52398 18.4721L0.915527 11.0557L11.4302 9.52786L16.1324 0L20.8347 9.52786L31.3493 11.0557L23.7409 18.4721L25.537 28.9443L16.1324 24Z" />
        </symbol>

        <symbol
            id="back"
            viewBox="0 0 24 24"
            fill="none"
            fillRule="evenodd"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
        >
            <g transform="matrix(-1 0 0 1 19 5)">
                <polyline points="3.5 3.167 10.5 -3.5 10.5 10.5" transform="rotate(90 7 3.5)" />
                <polyline points="3.5 10.167 10.5 3.5 10.5 17.5" transform="matrix(0 -1 -1 0 17.5 17.5)" />
            </g>
        </symbol>

        <symbol
            id="fire"
            width="24"
            height="24"
            fill="none"
            clipRule="evenodd"
            stroke="#F5264E"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M15.032 4.603 14.628 3l-1.146 1.167c-1.3 1.323-2.1 2.604-2.535 4.008l-.017.056c-.332 1.095-.438 2.156-.444 3.813v.08l-.036-.014c-.792-.338-1.535-1.221-1.937-2.286l-.52-1.375-1.006 1.053c-1.806 1.887-2.423 4.241-1.677 6.564C6.233 18.937 9.032 21 12 21c3.86 0 7-3.209 7-7.157 0-1.057-.148-1.893-.462-2.647l-.023-.055c-.25-.584-.513-.993-1.114-1.797l-.23-.307a15.38 15.38 0 0 1-.664-.942c-.64-.993-1.115-2.066-1.475-3.492Z" />
        </symbol>

        <symbol id="reload" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 7.5c3.6-5.2 13.5-3.5 14 5V14M18 17.5c-3.6 5.2-13.5 3.5-14-5v-1" />
            <path d="m22 12.5-2 2-2-2M2 12.5l2-2 2 2" strokeLinejoin="round" />
        </symbol>

        <svg id="warning" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle id="Oval" cx="9" cy="9" r="9" transform="matrix(1 0 0 -1 3 21)" stroke="#D58500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path id="Line" d="M12 8V14" stroke="#D58500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path id="Path 14 Copy" d="M11.997 16.4045C12.009 16.4025 11.997 16.5955 11.997 16.5955" stroke="#D58500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <symbol id="bullets" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM12 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM12 20a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
        </symbol>

        {/* Common icons */}
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

        <symbol id="cross" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6.43 6.43 17.6 17.6m-11.17-.03L17.6 6.4" />
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

        <symbol
            id="info"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-6M12 7.6v-.2" />
        </symbol>

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

        <symbol id="fire-outline" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.032 4.603 14.628 3l-1.146 1.167c-1.3 1.323-2.1 2.604-2.535 4.008l-.017.056c-.332 1.095-.438 2.156-.444 3.813v.08l-.036-.014c-.792-.338-1.535-1.221-1.937-2.286l-.52-1.375-1.006 1.053c-1.806 1.887-2.423 4.241-1.677 6.564C6.233 18.937 9.032 21 12 21c3.86 0 7-3.209 7-7.157 0-1.057-.148-1.892-.462-2.647l-.023-.055c-.25-.584-.513-.993-1.114-1.797l-.23-.307a15 15 0 0 1-.664-.942c-.64-.993-1.115-2.066-1.475-3.492" clipRule="evenodd" />
        </symbol>

        <symbol id="rocket" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" d="M15.162 7.75a1.413 1.413 0 1 1 0 2.826 1.413 1.413 0 0 1 0-2.826Z" />
            <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M14.75 15.75v5.5M4.5 17v3h3M9.25 9.75h-5.5" />
            <path stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" d="m13.485 3.828 6.364.708.707 6.364-9.9 7.07-4.242-4.242z" />
        </symbol>

        <symbol id="globe" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18" clipRule="evenodd" />
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.5 3.5q.413 1.75.654 3.5M19 7a26 26 0 0 1-3.746.784 36.4 36.4 0 0 1 0 8.434q1.872.246 3.746.782M15.154 17a38 38 0 0 1-.654 3.5M9.5 20.5a38 38 0 0 1-.654-3.5M5 17a26 26 0 0 1 3.747-.784 36.2 36.2 0 0 1 0-8.433A26 26 0 0 1 5 7v0M8.846 7q.242-1.75.654-3.5v0M9.5 16.128a24.6 24.6 0 0 1 5 0M14.5 7.873a24.6 24.6 0 0 1-5 0M3 12h18" />
        </symbol>

        <symbol id="device" viewBox="0 0 24 24" fill="none">
            <rect width="12" height="19" x="6" y="2" stroke="currentColor" strokeWidth="1.5" rx="3" />
            <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M10.5 4.5h3" />
        </symbol>

        <symbol id="web-activity" viewBox="0 0 24 24" fill="none">
            <rect width="16" height="6" x="4" y="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" rx="1" />
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16h-1M14 16h-1" />
            <rect width="16" height="6" x="4" y="5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" rx="1" />
        </symbol>

        {/* AG-55378 personalized onboarding paywall icons - start */}
        <symbol
            id="buffering"
            viewBox="0 0 24 24"
            fill="none"
        >
            <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M6.29 5.043q.171-.141.348-.273M8.555 3.683A9 9 0 0 1 9.8 3.27M12 3a9 9 0 1 1-8.317 12.445"
            />
        </symbol>

        <symbol
            id="encrypted"
            viewBox="0 0 24 24"
            fill="none"
        >
            <path
                fill="currentColor"
                d="m7.758 10.331-.313-.682-.437.2v.482zm8.484 0h.75v-.482l-.437-.2zm-3.492 2.305a.75.75 0 0 0-1.5 0h1.5m-1.5 1.273a.75.75 0 0 0 1.5 0h-1.5M8.826 9.455a.75.75 0 0 0 1.5 0h-1.5m3.092-3.819v.75zm1.756 3.819a.75.75 0 0 0 1.5 0h-1.5m3.175-3.182v-.75h-.493l-.196.452zm0 11.454-.701.267.184.483h.517zM7.152 6.273l.688-.298-.196-.452h-.492zm0 11.454v.75h.516l.184-.483zm.606-7.396h-.75c0 .646-.005 2.454.571 4.114.29.837.746 1.687 1.469 2.332.74.66 1.714 1.064 2.952 1.064v-1.5c-.883 0-1.5-.278-1.954-.683-.47-.419-.81-1.015-1.05-1.705-.484-1.394-.488-2.966-.488-3.622zM12 17.091v.75c1.238 0 2.213-.405 2.952-1.064.723-.645 1.178-1.495 1.469-2.332.576-1.66.571-3.468.571-4.114h-1.5c0 .656-.004 2.228-.488 3.622-.24.69-.58 1.286-1.05 1.705-.455.405-1.07.683-1.954.683zm4.242-6.76.313-.682c-1.433-.656-3.143-.944-4.555-.944v1.5c1.24 0 2.73.258 3.93.808zM12 9.455v-.75c-1.412 0-3.122.288-4.555.944l.313.682.312.682c1.2-.55 2.69-.809 3.93-.809zm0 3.181h-.75v1.273h1.5v-1.273zM9.576 9.455h.75c0-.894.014-1.692.246-2.274.106-.267.245-.448.422-.57.178-.12.458-.225.924-.225v-1.5c-.696 0-1.29.16-1.77.487-.48.328-.781.78-.97 1.253-.358.9-.352 2.011-.352 2.829zm2.342-3.819v.75c.47 0 .77.102.97.23.199.126.353.312.474.575.259.564.312 1.363.312 2.264h1.5c0-.88-.037-1.99-.449-2.89a2.8 2.8 0 0 0-1.031-1.215q-.735-.465-1.776-.464zm3.415 4.137.689.298 1.515-3.5-.688-.298-.689-.298-1.515 3.5zm1.516-3.5v.75h2.727v-1.5h-2.727zm-1.213 8.273-.7.267 1.212 3.181.7-.267.701-.267-1.212-3.182zm1.213 3.181v.75h2.727v-1.5h-2.727zm2.727-11.454h-.75c0 1.082.844 2.022 1.962 2.022v-1.5c-.221 0-.462-.199-.462-.522zm1.212 1.272v.75c1.118 0 1.962-.94 1.962-2.022h-1.5c0 .323-.241.522-.462.522zM22 6.273h.75c0-1.082-.844-2.023-1.962-2.023v1.5c.221 0 .462.2.462.523zM20.788 5v-.75c-1.118 0-1.962.94-1.962 2.023h1.5c0-.324.24-.523.462-.523zm-1.212 12.727h-.75c0 1.082.844 2.023 1.962 2.023v-1.5c-.221 0-.462-.2-.462-.523zM20.788 19v.75c1.118 0 1.962-.94 1.962-2.023h-1.5c0 .324-.241.523-.462.523zM22 17.727h.75c0-1.082-.844-2.023-1.962-2.023v1.5c.221 0 .462.2.462.523zm-1.212-1.273v-.75c-1.118 0-1.962.941-1.962 2.023h1.5c0-.323.24-.523.462-.523zM8.667 9.773l.688-.298-1.515-3.5-.688.298-.689.298 1.515 3.5zm-1.515-3.5v-.75H4.424v1.5h2.728zm1.212 8.273-.701-.268L6.45 17.46l.7.267.701.267 1.213-3.181zm-1.212 3.181v-.75H4.424v1.5h2.728zM4.424 6.273h-.75c0 .323-.24.522-.462.522v1.5c1.118 0 1.962-.94 1.962-2.022zM3.212 7.545v-.75c-.221 0-.462-.199-.462-.522h-1.5c0 1.082.844 2.022 1.962 2.022zM2 6.273h.75c0-.324.241-.523.462-.523v-1.5c-1.118 0-1.962.94-1.962 2.023zM3.212 5v.75c.221 0 .462.2.462.523h1.5c0-1.082-.844-2.023-1.962-2.023zm1.212 12.727h-.75c0 .324-.24.523-.462.523v1.5c1.118 0 1.962-.94 1.962-2.023zM3.212 19v-.75c-.221 0-.462-.2-.462-.523h-1.5c0 1.082.844 2.023 1.962 2.023zM2 17.727h.75c0-.323.241-.523.462-.523v-1.5c-1.118 0-1.962.941-1.962 2.023zm1.212-1.273v.75c.221 0 .462.2.462.523h1.5c0-1.082-.844-2.023-1.962-2.023z"
            />
        </symbol>

        <symbol
            id="streaming-services"
            viewBox="0 0 24 24"
            fill="none"
        >
            <rect
                width="18"
                height="18"
                x="3"
                y="3"
                stroke="currentColor"
                strokeWidth="1.5"
                rx="4"
            />
            <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                clipRule="evenodd"
                d="m16 12-6 4V8z"
            />
        </symbol>

        <symbol
            id="location"
            viewBox="0 0 24 24"
            fill="none"
        >
            <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                clipRule="evenodd"
                d="M4 9.368C4 5.298 7.582 2 12 2s8 3.299 8 7.368C20 14.781 12 22 12 22S4 14.781 4 9.368"
            />
            <circle
                cx="12"
                cy="10"
                r="3"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
            />
        </symbol>
        {/* AG-55378 personalized onboarding paywall icons - end */}
    </svg>
);
