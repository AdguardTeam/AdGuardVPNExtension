/* eslint-disable react/no-unknown-property */
import React from 'react';

import './icons.pcss';

export const Icons = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="hidden">
        <symbol
            id="sidebar-burger"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M4 12H20" />
            <path d="M4 7H20" />
            <path d="M4 17H20" />
        </symbol>

        <symbol
            id="arrow-down"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M6 10L12 16L18 10" />
        </symbol>

        <symbol
            id="tick"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g fill="none" fillRule="evenodd">
                <path d="m5 12 6 6 8-9" />
            </g>
        </symbol>

        <symbol
            id="plus"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        >
            <path d="M4 12H20" />
            <path d="M12 4L12 20" />
        </symbol>

        <symbol
            id="cross"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        >
            <path d="M6.42857143 6.42857143L17.604347 17.604347M6.42857143 17.5714286L17.604347 6.39565302" />
        </symbol>

        <symbol
            id="basket"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M7 9h10l-.763 10.076a1 1 0 0 1-.997.924H8.76a1 1 0 0 1-.997-.924L7 9Z" clipRule="evenodd" />
            <path d="M6 6.5h12M14 6V4h-4v2" />
            <path d="M13.5 12v5-5ZM10.5 12v5-5Z" clipRule="evenodd" />
        </symbol>

        <symbol
            id="edit"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M4 20.5h15.983" />
            <path clipRule="evenodd" d="m10.778 16.435-4.242-4.243 7.07-7.07a3 3 0 0 1 4.243 0v0a3 3 0 0 1 0 4.242l-7.07 7.071ZM5.121 17.85l1.415-5.658 4.242 4.243-5.657 1.414Z" />
            <path d="M16.789 9.01 13.96 6.182" />
        </symbol>

        <symbol
            id="question"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="m11.0110988 13.9153226c0-.6272433.0754709-1.1267903.2264151-1.4986559.1509441-.3718657.427301-.7381255.8290788-1.0987904.4017778-.3606648.6692557-.6541207.8024417-.8803763s.199778-.46482849.199778-.71572581c0-.75717224-.3462784-1.13575268-1.0388457-1.13575268-.3285255 0-.5915639.1019255-.7891232.30577957-.1975592.20385406-.3007769.48498924-.3096559.84341397h-1.9311876c.00887907-.85573904.28301617-1.52553521.82241953-2.0094086.53940337-.48387339 1.27524507-.72580645 2.20754717-.72580645.9411812 0 1.6714735.2296124 2.190899.68884409.5194255.45923168.7791343 1.1077467.7791343 1.94556451 0 .3808263-.0843499.7403657-.2530522 1.078629-.1687023.3382634-.4639268.7134836-.8856825 1.1256721l-.5394007.5174731c-.3374046.3270626-.5305214.7101232-.5793563 1.1491935l-.026637.4099463zm-.1931188 2.063172c0-.3001807.1009979-.5477141.3029967-.7426075.2019988-.1948935.4605978-.2923387.7758047-.2923387s.5738058.0974452.7758046.2923387c.2019988.1948934.3029967.4424268.3029967.7426075 0 .2957004-.0987782.5398736-.2963374.7325269-.1975593.1926533-.458378.2889785-.7824639.2889785-.324086 0-.5849047-.0963252-.782464-.2889785-.1975592-.1926533-.2963374-.4368265-.2963374-.7325269z" fill="currentColor" />
        </symbol>

        <symbol
            id="bug"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g fill="none" fillRule="evenodd">
                <path fill="#878787" fillOpacity=".01" d="M0 0h24v24H0z" />
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 5a6 6 0 016 6v4a6 6 0 11-12 0v-4a6 6 0 016-6zm6 5h3m-6.25-5l1.5-2m-6.5 2l-1.5-2M2.5 10h3M18 14h3M2.5 14h3m12 4H21M2.5 18h4m0-6.5h11" />
            </g>
        </symbol>

        <symbol
            id="send-feedback"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g fill="none" fillRule="evenodd">
                <path fill="none" fillOpacity="0" d="M0 0h24v24H0z" />
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 12H7l-3 8 17-8L4 4l3 8z" />
            </g>
        </symbol>

        <svg
            id="checkbox-disabled"
            viewBox="0 0 24 24"
            fill="none"
            fillRule="evenodd"
            clipRule="evenodd"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M21 3H3V21H21V3Z" />
        </svg>

        <svg
            id="checkbox-enabled"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M22 22V2H2V22H22ZM17.5691 9.4885C17.8389 9.1742 17.8028 8.7007 17.4885 8.43091C17.1742 8.16112 16.7007 8.1972 16.4309 8.5115L10.9546 14.8913L7.53551 11.4044C7.24551 11.1087 6.77066 11.104 6.4749 11.394C6.17915 11.684 6.17448 12.1589 6.46449 12.4546L11.028 17.1087L17.5691 9.4885Z" />
        </svg>

        <svg
            id="checkbox-partly-enabled"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path fillRule="evenodd" clipRule="evenodd" d="M21 3H3V21H21V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="9.5" y="9.5" width="5" height="5" stroke="currentColor" strokeWidth="5" strokeLinejoin="miter" />
        </svg>

        <symbol
            id="checkmark"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path fillRule="evenodd" clipRule="evenodd" d="M17.2408 7.83969C17.6055 8.15676 17.6441 8.70944 17.327 9.07412L11.2409 16.0741C11.079 16.2603 10.8461 16.3695 10.5995 16.3748C10.3528 16.3801 10.1154 16.2811 9.94566 16.1021L6.69841 12.6777C6.36589 12.327 6.38059 11.7732 6.73125 11.4407C7.08191 11.1082 7.63574 11.1229 7.96825 11.4735L10.5525 14.1987L16.0063 7.9259C16.3234 7.56122 16.8761 7.52262 17.2408 7.83969Z" fill="white" />
        </symbol>

        <symbol
            id="external-link"
            viewBox="0 0 25 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M18.5 11.8334V6.00004L12.7857 6.00004" />
            <path d="M18.421 6.03914L11.632 12.9696" />
            <path d="M9.26672 7H8.5C7.39543 7 6.5 7.89543 6.5 9V16C6.5 17.1046 7.39543 18 8.5 18H15.5C16.6046 18 17.5 17.1046 17.5 16V15.2961" />
        </symbol>

        <symbol
            id="pencil"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path fillRule="evenodd" clipRule="evenodd" d="M7.18555 10.9567L4.35712 8.12827L9.07117 3.41422C9.85221 2.63318 11.1185 2.63318 11.8996 3.41422V3.41422C12.6806 4.19527 12.6806 5.4616 11.8996 6.24265L7.18555 10.9567Z" />
            <path fillRule="evenodd" clipRule="evenodd" d="M3.41416 11.8995L4.35696 8.12827L7.18539 10.9567L3.41416 11.8995Z" />
            <path d="M11.1925 6.00694L9.30687 4.12132" />
        </symbol>

        <svg
            id="globe"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path fillRule="evenodd" clipRule="evenodd" d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" />
            <path d="M14.5001 3.5C14.7747 4.66688 14.9927 5.83376 15.1542 7.00065" />
            <path d="M19.0002 7C17.7516 7.35674 16.503 7.61803 15.2544 7.78387C15.4181 9.18865 15.5002 10.5943 15.5002 12C15.5002 13.406 15.4181 14.812 15.2539 16.218C16.5017 16.3817 17.7509 16.6431 19.0002 17" />
            <path d="M15.1541 17.0004C14.9926 18.1669 14.7747 19.3335 14.5002 20.5" />
            <path d="M9.49982 20.5C9.22533 19.3335 9.00736 18.1669 8.84589 17.0004" />
            <path d="M5 17C6.24891 16.6432 7.49781 16.3818 8.74672 16.216C8.58208 14.812 8.5 13.406 8.5 12C8.5 10.5943 8.58205 9.18865 8.74614 7.78297C7.49781 7.61816 6.24891 7.35683 5 7V7" />
            <path d="M8.84582 7.00065C9.0073 5.83376 9.22533 4.66688 9.49989 3.5V3.5" />
            <path d="M9.50049 16.1275C10.3336 16.0425 11.1668 16 11.9999 16C12.8331 16 13.6662 16.0425 14.4993 16.1275" />
            <path d="M14.4993 7.87251C13.6662 7.9575 12.8331 8 11.9999 8C11.1668 8 10.3336 7.9575 9.50049 7.87251" />
            <path d="M3 12H21" />
        </svg>

        {/* OLD ICONS, FIXME: Check usage */}

        <symbol id="spinner" fill="none" viewBox="0 0 24 24">
            <path d="M6.2903 5.04276C6.40404 4.94931 6.52011 4.8586 6.63842 4.77072" stroke="#74A352" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.55511 3.68292C8.82001 3.57307 9.0913 3.47551 9.36826 3.39095C9.51032 3.34758 9.65388 3.30762 9.79883 3.27119" stroke="#74A352" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C9.51472 21 7.26472 19.9926 5.63604 18.364C4.80704 17.535 4.13901 16.545 3.68286 15.4449" stroke="#74A352" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>

        <svg id="warning" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="9" r="9" transform="matrix(1 0 0 -1 3 21)" stroke="#D58500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 8V14" stroke="#D58500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.997 16.4045C12.009 16.4025 11.997 16.5955 11.997 16.5955" stroke="#D58500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </svg>
);
