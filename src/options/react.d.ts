import { type AriaAttributes, type DOMAttributes } from 'react';

declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        /**
       * Indicates that the browser will ignore this element and its descendants,
       * preventing some interactions and hiding it from assistive technology.
       * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert
       * @see https://github.com/facebook/react/pull/24730
       *
       * TODO: Remove this stub declaration after updating react to newer version.
       */
        inert?: '';
    }
}
