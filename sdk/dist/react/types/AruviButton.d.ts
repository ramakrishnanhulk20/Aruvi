/**
 * Aruvi Button
 * Embeddable "Pay with Aruvi" button for vanilla JS
 */
import type { AruviButtonOptions } from './types';
export declare class AruviButton {
    private container;
    private button;
    private options;
    private clickHandler;
    private static defaultOptions;
    constructor(container: HTMLElement | string, options?: AruviButtonOptions);
    /**
     * Generate button styles
     */
    private getStyles;
    /**
     * Render the button
     */
    private render;
    /**
     * Set click handler
     */
    onClick(handler: () => void): AruviButton;
    /**
     * Update button options
     */
    update(options: Partial<AruviButtonOptions>): AruviButton;
    /**
     * Set loading state
     */
    setLoading(loading: boolean): AruviButton;
    /**
     * Enable the button
     */
    enable(): AruviButton;
    /**
     * Disable the button
     */
    disable(): AruviButton;
    /**
     * Get the button element
     */
    getElement(): HTMLButtonElement | null;
    /**
     * Destroy the button
     */
    destroy(): void;
}
/**
 * Factory function to create buttons
 */
export declare function createAruviButton(container: HTMLElement | string, options?: AruviButtonOptions): AruviButton;
