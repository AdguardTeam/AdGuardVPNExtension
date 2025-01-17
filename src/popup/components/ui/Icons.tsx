/* eslint-disable react/no-unknown-property */
import React from 'react';

import './icon.pcss';

export const Icons = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="hidden">
        <symbol id="arrow" viewBox="0 0 36 18">
            <path d="M7 1L0.999999 7L7 13" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>

        <svg id="right-arrow" width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M1 13L7 7L1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <symbol id="options" viewBox="0 0 24 24">
            <g fill="currentColor" transform="translate(10 6)">
                <circle cx="1.5" cy="1.5" r="1.5" />
                <circle cx="1.5" cy="6.5" r="1.5" />
                <circle cx="1.5" cy="11.5" r="1.5" />
            </g>
        </symbol>

        <symbol id="bullet_on" viewBox="0 0 24 24">
            <g fill="none" fillRule="evenodd" transform="translate(2 2)">
                <circle cx="10" cy="10" r="9.25" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="10" cy="10" r="6" fill="currentColor" />
            </g>
        </symbol>

        <symbol id="bar" viewBox="0 0 520 520" width="20" height="20">
            <path d="M492 236H20c-11.046 0-20 8.954-20 20s8.954 20 20 20h472c11.046 0 20-8.954 20-20s-8.954-20-20-20zM492 76H20C8.954 76 0 84.954 0 96s8.954 20 20 20h472c11.046 0 20-8.954 20-20s-8.954-20-20-20zM492 396H20c-11.046 0-20 8.954-20 20s8.954 20 20 20h472c11.046 0 20-8.954 20-20s-8.954-20-20-20z" data-original="#000000" data-old_color="#000000" fill="currentColor" />
        </symbol>

        <symbol id="gift" viewBox="0 0 24 24" width="24" height="24">
            <rect x="5" y="10" width="14" height="11" stroke="#74A352" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <rect x="-0.75" y="0.75" width="17.5" height="2.5" transform="matrix(1 0 0 -1 4 10.5)" stroke="#74A352" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <path d="M12 6.14273C12.8741 4.55946 14.9219 1.62639 16.6002 3.73742C18.2784 5.84844 14.2726 6.31865 12 6.14273Z" stroke="#74A352" strokeWidth="1.5" fill="none" />
            <path d="M11.8911 6.65113C11.0361 4.94529 9.03282 1.78516 7.39111 4.05961C5.74941 6.33406 9.66797 6.84067 11.8911 6.65113Z" stroke="#74A352" strokeWidth="1.5" fill="none" />
        </symbol>

        <symbol id="bullet_off" viewBox="0 0 24 24">
            <circle cx="10" cy="10" r="9.25" fill="none" stroke="#909090" strokeWidth="1.5" transform="translate(2 2)" />
        </symbol>

        <symbol id="lock" viewBox="0 0 24 24">
            <g fill="none" fillRule="evenodd" transform="translate(-16 -282)">
                <g transform="translate(0 56)">
                    <g stroke="#909090" strokeWidth="1.5" transform="translate(20 229)">
                        <path strokeLinecap="round" d="M8,11 L8,13" />
                        <path d="M4,6 C4,3.31191182 4.02838306,0 7.86539235,0 C11.7024016,0 12,3.20226892 12,6" />
                        <rect width="14.5" height="11.5" x=".75" y="5.75" rx="2" />
                    </g>
                </g>
            </g>
        </symbol>

        <svg id="auth_icon_adguard" viewBox="0 0 27 27">
            <g id="01" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g id="Artboard" transform="translate(-20.000000, -17.000000)">
                    <g id="Group-9" transform="translate(20.000000, 17.000000)">
                        <g id="Group-8">
                            <g id="Group-7">
                                <path d="M13.2333196,0 C9.09699042,0 4.1075434,0.965680851 4.05824813e-06,3.09121277 C4.05824813e-06,7.68178723 -0.0566942033,19.1182979 13.2333196,26.9325 C26.5236271,19.1182979 26.4672226,7.68178723 26.4672226,3.09121277 C22.3593895,0.965680851 17.3699425,0 13.2333196,0 L13.2333196,0 Z" id="Path" fill="#68BC71" />
                                <path d="M13.2198019,26.924548 C-0.0566557505,19.1105411 4.05824813e-06,7.6802303 4.05824813e-06,3.09121277 C4.10306989,0.967995763 9.08612348,0.00210481739 13.2198019,3.43653112e-06 L13.2198019,26.9245507 Z" id="Combined-Shape" fill="#67B279" />
                            </g>
                            <path d="M12.7506203,17.9702409 L20.7530282,7.26255387 C20.166628,6.79592449 19.6522713,7.12526186 19.3691238,7.38023274 L19.358792,7.38104995 L12.6863956,14.2720736 L10.1724142,11.2685385 C8.97308618,9.89289441 7.34261442,10.9421976 6.96173353,11.2195057 L12.7506203,17.9702409" id="Fill-11" fill="#FFFFFF" />
                        </g>
                    </g>
                </g>
            </g>
        </svg>

        <svg id="auth_icon_apple" viewBox="0 0 12 14">
            <defs>
                <path id="a" d="M9.71392487,3.4619702 C10.1999732,2.89864476 10.5276008,2.11398907 10.4379414,1.33333333 C9.73751945,1.35999963 8.89013699,1.7806604 8.38790951,2.3433192 C7.93691598,2.84264554 7.54322358,3.64063437 7.64906212,4.40595699 C8.43037976,4.46395618 9.22787654,4.02596231 9.71392487,3.4619702 M11.4659909,8.41656751 C11.4855407,10.4345393 13.3131094,11.1058632 13.3333333,11.1145297 C13.3185025,11.1618624 13.0414347,12.071183 12.3706745,13.0111699 C11.7902478,13.8231585 11.188249,14.6318138 10.2397469,14.6491469 C9.30809811,14.6658134 9.00810988,14.119821 7.94230903,14.119821 C6.87718231,14.119821 6.54416167,14.6318138 5.66239854,14.6658134 C4.74692886,14.6984796 4.04920345,13.787159 3.46473201,12.977837 C2.26882391,11.3225268 1.35537662,8.29990248 2.58229475,6.25993104 C3.19170902,5.24727855 4.28043032,4.60528753 5.46285581,4.58928776 C6.36147222,4.57262132 7.21020294,5.16861298 7.75961957,5.16861298 C8.30903621,5.16861298 9.34045639,4.45195635 10.4244588,4.5572882 C10.8781488,4.57528795 12.1522561,4.73261908 12.9699768,5.87993636 C12.903912,5.91926914 11.4498118,6.72992446 11.4659909,8.41656751" />
            </defs>
            <use fill="currentColor" fillRule="evenodd" transform="translate(-2 -1)" xlinkHref="#a" />
        </svg>

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

        <symbol id="back" viewBox="0 0 24 24">
            <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" transform="matrix(-1 0 0 1 19 5)">
                <polyline points="3.5 3.167 10.5 -3.5 10.5 10.5" transform="rotate(90 7 3.5)" />
                <polyline points="3.5 10.167 10.5 3.5 10.5 17.5" transform="matrix(0 -1 -1 0 17.5 17.5)" />
            </g>
        </symbol>

        <symbol id="reload" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 25">
            <path d="M6 7.5c3.6-5.2 13.5-3.5 14 5V14M18 17.5c-3.6 5.2-13.5 3.5-14-5v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="m22 12.5-2 2-2-2M2 12.5l2-2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>

        <symbol id="closed_eye" viewBox="0 0 24 24">
            <path d="M4 10C4 10 8 14.772 12 14.772C16 14.772 20 10 20 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 15V17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M18 13V15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M6 13V15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </symbol>

        <symbol id="open_eye" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M4 11.772C6.66667 8.59065 9.33333 7 12 7C14.6667 7 17.3333 8.59065 20 11.772C20 11.772 16 16.772 12 16.772C8 16.772 4 11.772 4 11.772Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path fillRule="evenodd" clipRule="evenodd" d="M12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </symbol>

        <svg id="cross" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="m6.429 6.429 11.175 11.175M6.429 17.571 17.605 6.396" />
        </svg>

        <symbol id="checked" viewBox="0 0 24 24" fill="#74a352">
            <path d="m22 2v20h-20v-20zm-4.5114987 6.43090736c-.3143011-.26979185-.7878021-.23370989-1.0575939.08059129l-5.4763417 6.37980985-3.41905258-3.4868822c-.29000246-.2957557-.76485329-.3004196-1.06060902-.0104172-.29575573.2900025-.30041967.7648533-.01041722 1.060609l4.56353872 4.6540734 6.541067-7.62019015c.2697919-.31430119.2337099-.78780215-.0805913-1.05759399z" />
        </symbol>

        <symbol id="unchecked" viewBox="0 0 24 24" stroke="#888" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
            <path d="m21 3h-18v18h18z" />
        </symbol>

        {/* TODO: there is star icon in popup, maybe worth refactoring */}
        <svg id="star" width="32" height="29" viewBox="0 0 32 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M16.1324 24L6.72787 28.9443L8.52398 18.4721L0.915527 11.0557L11.4302 9.52786L16.1324 0L20.8347 9.52786L31.3493 11.0557L23.7409 18.4721L25.537 28.9443L16.1324 24Z" />
        </svg>

        <svg id="email" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3.75" y="5.75" width="16.5" height="12.5" rx="1.25" stroke="#74A352" strokeWidth="1.5" />
            <path d="M4 6L10.2 10.65C11.2667 11.45 12.7333 11.45 13.8 10.65L20 6" stroke="#74A352" strokeWidth="1.5" />
            <circle cx="19.5" cy="5.5" r="2.5" fill="#D7283A" />
        </svg>

        <svg id="warning" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle id="Oval" cx="9" cy="9" r="9" transform="matrix(1 0 0 -1 3 21)" stroke="#D58500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path id="Line" d="M12 8V14" stroke="#D58500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path id="Path 14 Copy" d="M11.997 16.4045C12.009 16.4025 11.997 16.5955 11.997 16.5955" stroke="#D58500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <svg id="fire" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" d="M15.032 4.603 14.628 3l-1.146 1.167c-1.3 1.323-2.1 2.604-2.535 4.008l-.017.056c-.332 1.095-.438 2.156-.444 3.813v.08l-.036-.014c-.792-.338-1.535-1.221-1.937-2.286l-.52-1.375-1.006 1.053c-1.806 1.887-2.423 4.241-1.677 6.564C6.233 18.937 9.032 21 12 21c3.86 0 7-3.209 7-7.157 0-1.057-.148-1.893-.462-2.647l-.023-.055c-.25-.584-.513-.993-1.114-1.797l-.23-.307a15.38 15.38 0 0 1-.664-.942c-.64-.993-1.115-2.066-1.475-3.492Z" stroke="#F5264E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

    </svg>
);
