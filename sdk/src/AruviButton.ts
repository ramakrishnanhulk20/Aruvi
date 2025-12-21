/**
 * Aruvi Button
 * Embeddable "Pay with Aruvi" button for vanilla JS
 */

import type { AruviButtonOptions, ButtonVariant, ButtonSize } from './types';
import { BUTTON_STYLES, ARUVI_LOGO_SVG } from './constants';

export class AruviButton {
  private container: HTMLElement;
  private button: HTMLButtonElement | null = null;
  private options: Required<AruviButtonOptions>;
  private clickHandler: (() => void) | null = null;

  private static defaultOptions: Required<AruviButtonOptions> = {
    label: 'Pay with Aruvi',
    variant: 'primary',
    size: 'medium',
    showLogo: true,
    disabled: false,
    className: '',
  };

  constructor(
    container: HTMLElement | string,
    options: AruviButtonOptions = {}
  ) {
    // Get container element
    if (typeof container === 'string') {
      const el = document.querySelector(container);
      if (!el) {
        throw new Error(`Aruvi: Container element "${container}" not found`);
      }
      this.container = el as HTMLElement;
    } else {
      this.container = container;
    }

    this.options = { ...AruviButton.defaultOptions, ...options };
    this.render();
  }

  /**
   * Generate button styles
   */
  private getStyles(): string {
    const { variant, size, disabled } = this.options;
    
    let styles = BUTTON_STYLES.base;
    styles += BUTTON_STYLES.sizes[size];
    styles += BUTTON_STYLES.variants[variant];
    
    if (disabled) {
      styles += BUTTON_STYLES.disabled;
    }

    return styles.replace(/\s+/g, ' ').trim();
  }

  /**
   * Render the button
   */
  private render(): void {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = `aruvi-button ${this.options.className}`.trim();
    this.button.disabled = this.options.disabled;
    this.button.setAttribute('style', this.getStyles());

    // Content
    let content = '';
    if (this.options.showLogo) {
      content += `<span class="aruvi-button-logo">${ARUVI_LOGO_SVG}</span>`;
    }
    content += `<span class="aruvi-button-label">${this.options.label}</span>`;
    this.button.innerHTML = content;

    // Hover effects
    const variant = this.options.variant;
    this.button.onmouseenter = () => {
      if (!this.options.disabled && this.button) {
        this.button.setAttribute('style', this.getStyles() + BUTTON_STYLES.hover[variant]);
      }
    };
    this.button.onmouseleave = () => {
      if (this.button) {
        this.button.setAttribute('style', this.getStyles());
      }
    };

    // Clear container and append button
    this.container.innerHTML = '';
    this.container.appendChild(this.button);
  }

  /**
   * Set click handler
   */
  onClick(handler: () => void): AruviButton {
    this.clickHandler = handler;
    if (this.button) {
      this.button.onclick = handler;
    }
    return this;
  }

  /**
   * Update button options
   */
  update(options: Partial<AruviButtonOptions>): AruviButton {
    this.options = { ...this.options, ...options };
    this.render();
    if (this.clickHandler) {
      this.onClick(this.clickHandler);
    }
    return this;
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): AruviButton {
    if (!this.button) return this;

    if (loading) {
      this.button.disabled = true;
      this.button.innerHTML = `
        <span class="aruvi-spinner" style="
          width: 20px;
          height: 20px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: aruvi-spin 1s linear infinite;
        "></span>
        <span>Processing...</span>
      `;
      
      // Add animation if not already present
      if (!document.getElementById('aruvi-button-styles')) {
        const style = document.createElement('style');
        style.id = 'aruvi-button-styles';
        style.textContent = `
          @keyframes aruvi-spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      this.button.disabled = this.options.disabled;
      this.render();
      if (this.clickHandler) {
        this.onClick(this.clickHandler);
      }
    }

    return this;
  }

  /**
   * Enable the button
   */
  enable(): AruviButton {
    this.options.disabled = false;
    if (this.button) {
      this.button.disabled = false;
      this.button.setAttribute('style', this.getStyles());
    }
    return this;
  }

  /**
   * Disable the button
   */
  disable(): AruviButton {
    this.options.disabled = true;
    if (this.button) {
      this.button.disabled = true;
      this.button.setAttribute('style', this.getStyles());
    }
    return this;
  }

  /**
   * Get the button element
   */
  getElement(): HTMLButtonElement | null {
    return this.button;
  }

  /**
   * Destroy the button
   */
  destroy(): void {
    if (this.button) {
      this.button.remove();
      this.button = null;
    }
    this.clickHandler = null;
  }
}

/**
 * Factory function to create buttons
 */
export function createAruviButton(
  container: HTMLElement | string,
  options?: AruviButtonOptions
): AruviButton {
  return new AruviButton(container, options);
}
