import React from 'react';

import './icon.pcss';

const Icons = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="hidden">
        <svg id="social_apple" viewBox="0 0 12 14">
            <defs>
                <path id="a" d="M9.71392487,3.4619702 C10.1999732,2.89864476 10.5276008,2.11398907 10.4379414,1.33333333 C9.73751945,1.35999963 8.89013699,1.7806604 8.38790951,2.3433192 C7.93691598,2.84264554 7.54322358,3.64063437 7.64906212,4.40595699 C8.43037976,4.46395618 9.22787654,4.02596231 9.71392487,3.4619702 M11.4659909,8.41656751 C11.4855407,10.4345393 13.3131094,11.1058632 13.3333333,11.1145297 C13.3185025,11.1618624 13.0414347,12.071183 12.3706745,13.0111699 C11.7902478,13.8231585 11.188249,14.6318138 10.2397469,14.6491469 C9.30809811,14.6658134 9.00810988,14.119821 7.94230903,14.119821 C6.87718231,14.119821 6.54416167,14.6318138 5.66239854,14.6658134 C4.74692886,14.6984796 4.04920345,13.787159 3.46473201,12.977837 C2.26882391,11.3225268 1.35537662,8.29990248 2.58229475,6.25993104 C3.19170902,5.24727855 4.28043032,4.60528753 5.46285581,4.58928776 C6.36147222,4.57262132 7.21020294,5.16861298 7.75961957,5.16861298 C8.30903621,5.16861298 9.34045639,4.45195635 10.4244588,4.5572882 C10.8781488,4.57528795 12.1522561,4.73261908 12.9699768,5.87993636 C12.903912,5.91926914 11.4498118,6.72992446 11.4659909,8.41656751" />
            </defs>
            <use fill="#131313" fillRule="evenodd" transform="translate(-2 -1)" xlinkHref="#a" />
        </svg>

        <symbol id="social_facebook" viewBox="0 0 112.196 112.196" fill="currentColor">
            <circle cx="56.098" cy="56.098" r="56.098" fill="#3b5998" />
            <path d="M70.201 58.294h-10.01v36.672H45.025V58.294h-7.213V45.406h7.213v-8.34c0-5.964 2.833-15.303 15.301-15.303l11.234.047v12.51h-8.151c-1.337 0-3.217.668-3.217 3.513v7.585h11.334l-1.325 12.876z" fill="#fff" />
        </symbol>

        <symbol id="social_google" viewBox="0 0 25 25" fill="currentColor">
            <path d="M5.319 14.698l-.835 3.118-3.054.065A11.946 11.946 0 010 12.194c0-1.99.484-3.866 1.342-5.519l2.719.499 1.19 2.702a7.133 7.133 0 00-.383 2.318c0 .88.16 1.725.452 2.504z" fill="#FBBB00" />
            <path d="M23.79 9.952a12.022 12.022 0 01-.053 4.747 11.997 11.997 0 01-4.224 6.853h-.001l-3.424-.175-.485-3.025a7.152 7.152 0 003.078-3.652h-6.417V9.952H23.79z" fill="#518EF8" />
            <path d="M19.512 21.551v.001A11.95 11.95 0 0112 24.194c-4.57 0-8.543-2.554-10.57-6.313l3.889-3.183a7.135 7.135 0 0010.284 3.654l3.909 3.2z" fill="#28B446" />
            <path d="M19.66 2.957l-3.888 3.182a7.137 7.137 0 00-10.52 3.736l-3.91-3.2A11.998 11.998 0 0112 .194a11.95 11.95 0 017.66 2.763z" fill="#F14336" />
        </symbol>

        <symbol id="plus" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 12L20 12M12 4L12 20" />
        </symbol>

        <symbol id="cross" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6.42857143 6.42857143L17.604347 17.604347M6.42857143 17.5714286L17.604347 6.39565302" />
        </symbol>

        <symbol id="check" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round">
            <polyline points="5 11.767 10.588 17 19 8" />
        </symbol>

        <symbol id="unchecked" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round">
            <rect width="18.5" height="18.5" x=".75" y=".75" rx="3" transform="translate(2 2)" />
        </symbol>

        <symbol id="checked" viewBox="0 0 24 24" fill="none" strokeLinecap="round">
            <rect width="18.5" height="18.5" x="2.75" y="2.75" stroke="currentColor" strokeWidth="1.5" rx="3" />
            <polyline stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" points="0 2.93 3.991 7 10 0" transform="translate(7 9)" />
        </symbol>

        <symbol id="bullet_on" viewBox="0 0 24 24">
            <g fill="none" fillRule="evenodd" transform="translate(2 2)">
                <circle cx="10" cy="10" r="9.25" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="10" cy="10" r="6" fill="currentColor" />
            </g>
        </symbol>

        <symbol id="bullet_off" viewBox="0 0 24 24">
            <circle cx="10" cy="10" r="9.25" fill="none" stroke="#909090" strokeWidth="1.5" transform="translate(2 2)" />
        </symbol>

        <symbol id="question" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="m11.0110988 13.9153226c0-.6272433.0754709-1.1267903.2264151-1.4986559.1509441-.3718657.427301-.7381255.8290788-1.0987904.4017778-.3606648.6692557-.6541207.8024417-.8803763s.199778-.46482849.199778-.71572581c0-.75717224-.3462784-1.13575268-1.0388457-1.13575268-.3285255 0-.5915639.1019255-.7891232.30577957-.1975592.20385406-.3007769.48498924-.3096559.84341397h-1.9311876c.00887907-.85573904.28301617-1.52553521.82241953-2.0094086.53940337-.48387339 1.27524507-.72580645 2.20754717-.72580645.9411812 0 1.6714735.2296124 2.190899.68884409.5194255.45923168.7791343 1.1077467.7791343 1.94556451 0 .3808263-.0843499.7403657-.2530522 1.078629-.1687023.3382634-.4639268.7134836-.8856825 1.1256721l-.5394007.5174731c-.3374046.3270626-.5305214.7101232-.5793563 1.1491935l-.026637.4099463zm-.1931188 2.063172c0-.3001807.1009979-.5477141.3029967-.7426075.2019988-.1948935.4605978-.2923387.7758047-.2923387s.5738058.0974452.7758046.2923387c.2019988.1948934.3029967.4424268.3029967.7426075 0 .2957004-.0987782.5398736-.2963374.7325269-.1975593.1926533-.458378.2889785-.7824639.2889785-.324086 0-.5849047-.0963252-.782464-.2889785-.1975592-.1926533-.2963374-.4368265-.2963374-.7325269z" fill="currentColor" />
        </symbol>

        <symbol id="cross_bold" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6.42857143 6.42857143L17.604347 17.604347M6.42857143 17.5714286L17.604347 6.39565302" />
        </symbol>

        <symbol id="check_bold" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
            <polyline points="5 11.767 10.588 17 19 8" />
        </symbol>

        <symbol id="arrow" viewBox="0 0 24 24">
            <g fill="none" fillRule="evenodd">
                <path fill="#878787" fillOpacity=".01" d="M0 0h24v24H0z" />
                <path stroke="#888" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 18l6-6-6-6" />
            </g>
        </symbol>

        <symbol id="back-arrow" viewBox="0 0 24 24">
            <path fill="none" fillRule="evenodd" stroke="#888" strokeLinecap="round" strokeWidth="1.5" d="M15 18l-6-6 6-6" />
        </symbol>

        <symbol id="bug" viewBox="0 0 24 24">
            <g fill="none" fillRule="evenodd">
                <path fill="#878787" fillOpacity=".01" d="M0 0h24v24H0z" />
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 5a6 6 0 016 6v4a6 6 0 11-12 0v-4a6 6 0 016-6zm6 5h3m-6.25-5l1.5-2m-6.5 2l-1.5-2M2.5 10h3M18 14h3M2.5 14h3m12 4H21M2.5 18h4m0-6.5h11" />
            </g>
        </symbol>

        <symbol id="send-feedback" viewBox="0 0 24 24">
            <g fill="none" fillRule="evenodd">
                <path fill="none" fillOpacity="0" d="M0 0h24v24H0z" />
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 12H7l-3 8 17-8L4 4l3 8z" />
            </g>
        </symbol>

        <symbol id="chat" viewBox="0 0 24 24">
            <g fill="none" fillRule="evenodd">
                <path fill="none" fillOpacity="0" d="M0 0h24v24H0z" />
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18c6 0 10-3 10-7s-4-7-10-7S2 7 2 11c0 2 1 4 3 5l1 1 1 1H6h0v1h0v2l1-1h1l1-1s0 0 0 0h0l1-1h2zm0-6v-1m-4 1v-1m8 1v-1" />
            </g>
        </symbol>
    </svg>
);

export default Icons;
