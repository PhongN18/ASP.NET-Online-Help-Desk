export function Button({ children, type = "button", className, ...props }) {
    const baseStyles = "px-4 py-2 rounded-lg font-medium focus:outline-none transition";

    return (
        <button type={type} className={`${baseStyles} ${className}`} {...props}>
            {children}
        </button>
    );
}
