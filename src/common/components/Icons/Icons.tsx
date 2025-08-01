import React from 'react';

export const Icons = () => (
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
        <symbol
            id="closed_eye"
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
        >
            <path d="M4 10C4 10 8 14.772 12 14.772C16 14.772 20 10 20 10" />
            <path d="M12 15V17" />
            <path d="M18 13V15" />
            <path d="M6 13V15" />
        </symbol>

        <symbol
            id="open_eye"
            viewBox="0 0 24 24"
            fillRule="evenodd"
            clipRule="evenodd"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path d="M4 11.772C6.66667 8.59065 9.33333 7 12 7C14.6667 7 17.3333 8.59065 20 11.772C20 11.772 16 16.772 12 16.772C8 16.772 4 11.772 4 11.772Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10Z" />
        </symbol>

        <symbol id="auth_icon_apple" viewBox="0 0 12 14">
            <defs>
                <path id="a" d="M9.71392487,3.4619702 C10.1999732,2.89864476 10.5276008,2.11398907 10.4379414,1.33333333 C9.73751945,1.35999963 8.89013699,1.7806604 8.38790951,2.3433192 C7.93691598,2.84264554 7.54322358,3.64063437 7.64906212,4.40595699 C8.43037976,4.46395618 9.22787654,4.02596231 9.71392487,3.4619702 M11.4659909,8.41656751 C11.4855407,10.4345393 13.3131094,11.1058632 13.3333333,11.1145297 C13.3185025,11.1618624 13.0414347,12.071183 12.3706745,13.0111699 C11.7902478,13.8231585 11.188249,14.6318138 10.2397469,14.6491469 C9.30809811,14.6658134 9.00810988,14.119821 7.94230903,14.119821 C6.87718231,14.119821 6.54416167,14.6318138 5.66239854,14.6658134 C4.74692886,14.6984796 4.04920345,13.787159 3.46473201,12.977837 C2.26882391,11.3225268 1.35537662,8.29990248 2.58229475,6.25993104 C3.19170902,5.24727855 4.28043032,4.60528753 5.46285581,4.58928776 C6.36147222,4.57262132 7.21020294,5.16861298 7.75961957,5.16861298 C8.30903621,5.16861298 9.34045639,4.45195635 10.4244588,4.5572882 C10.8781488,4.57528795 12.1522561,4.73261908 12.9699768,5.87993636 C12.903912,5.91926914 11.4498118,6.72992446 11.4659909,8.41656751" />
            </defs>
            <use fill="currentColor" fillRule="evenodd" transform="translate(-2 -1)" xlinkHref="#a" />
        </symbol>

        <symbol id="auth_icon_facebook" viewBox="0 0 112.196 112.196" fill="currentColor">
            <circle cx="56.098" cy="56.098" r="56.098" fill="#3b5998" />
            <path d="M70.201 58.294h-10.01v36.672H45.025V58.294h-7.213V45.406h7.213v-8.34c0-5.964 2.833-15.303 15.301-15.303l11.234.047v12.51h-8.151c-1.337 0-3.217.668-3.217 3.513v7.585h11.334l-1.325 12.876z" fill="#fff" />
        </symbol>

        <symbol id="auth_icon_google" viewBox="0 0 25 25" fill="currentColor">
            <path d="M5.319 14.698l-.835 3.118-3.054.065A11.946 11.946 0 010 12.194c0-1.99.484-3.866 1.342-5.519l2.719.499 1.19 2.702a7.133 7.133 0 00-.383 2.318c0 .88.16 1.725.452 2.504z" fill="#FBBB00" />
            <path d="M23.79 9.952a12.022 12.022 0 01-.053 4.747 11.997 11.997 0 01-4.224 6.853h-.001l-3.424-.175-.485-3.025a7.152 7.152 0 003.078-3.652h-6.417V9.952H23.79z" fill="#518EF8" />
            <path d="M19.512 21.551v.001A11.95 11.95 0 0112 24.194c-4.57 0-8.543-2.554-10.57-6.313l3.889-3.183a7.135 7.135 0 0010.284 3.654l3.909 3.2z" fill="#28B446" />
            <path d="M19.66 2.957l-3.888 3.182a7.137 7.137 0 00-10.52 3.736l-3.91-3.2A11.998 11.998 0 0112 .194a11.95 11.95 0 017.66 2.763z" fill="#F14336" />
        </symbol>

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
    </svg>
);
