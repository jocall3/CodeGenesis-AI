import React from 'react';
import { InformationCircleIcon, XCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from '../icons';

export const LoadingSpinner = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) => {
    const sizeClasses = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
    return (
        <svg className={`animate-spin text-primary ${sizeClasses[size]} ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );
};

export const Button = ({ children, variant = 'primary', size = 'md', icon, className = '', disabled, onClick }: any) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-primary hover:bg-primary-hover text-white",
        secondary: "bg-surface-light hover:bg-border text-text-primary",
        success: "bg-success hover:bg-green-600 text-white",
        danger: "bg-error hover:bg-red-600 text-white",
    };
    const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
    
    return (
        <button className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`} disabled={disabled} onClick={onClick}>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: any) => {
    if (!isOpen) return null;
    const sizeClasses = { md: 'max-w-2xl', lg: 'max-w-4xl' };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`bg-surface w-full ${sizeClasses[size as keyof typeof sizeClasses]} rounded-lg shadow-xl border border-border max-h-[90vh] flex flex-col`}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-white"><XCircleIcon className="w-6 h-6" /></button>
                </div>
                <div className="overflow-y-auto flex-1">{children}</div>
            </div>
        </div>
    );
};

export const Tooltip = ({ children, content }: any) => (
    <div className="group relative inline-block">
        {children}
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-50">
            {content}
        </div>
    </div>
);

export const Select = ({ label, options, value, onChange, tooltip, id }: any) => (
    <div className="w-full">
        {label && (
             <div className="flex items-center mb-1">
                 <label htmlFor={id} className="block text-sm font-medium text-text-secondary">{label}</label>
                 {tooltip && <Tooltip content={tooltip}><InformationCircleIcon className="w-4 h-4 ml-1 text-text-secondary" /></Tooltip>}
             </div>
        )}
        <select
            id={id}
            value={value}
            onChange={onChange}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
        >
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

export const Input = ({ id, type = "text", value, onChange, min, step, tooltip, className }: any) => (
    <div className={className}>
         <div className="relative">
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                min={min}
                step={step}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
            {tooltip && <div className="absolute right-2 top-2"><Tooltip content={tooltip}><InformationCircleIcon className="w-4 h-4 text-text-secondary" /></Tooltip></div>}
         </div>
    </div>
);

export const Checkbox = ({ label, checked, onChange, tooltip }: any) => (
    <label className="flex items-center space-x-2 cursor-pointer select-none">
        <input type="checkbox" checked={checked} onChange={onChange} className="form-checkbox h-4 w-4 text-primary border-border rounded bg-background focus:ring-primary" />
        <span className="text-sm text-text-primary">{label}</span>
        {tooltip && <Tooltip content={tooltip}><InformationCircleIcon className="w-4 h-4 text-text-secondary" /></Tooltip>}
    </label>
);

export const Textarea = ({ id, value, onChange, placeholder, rows, tooltip }: any) => (
    <div className="w-full">
        <div className="relative">
            <textarea
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
             {tooltip && <div className="absolute right-2 top-2"><Tooltip content={tooltip}><InformationCircleIcon className="w-4 h-4 text-text-secondary" /></Tooltip></div>}
        </div>
    </div>
);

export const CodeEditor = React.forwardRef(({ value, onChange, language, placeholder, readOnly, theme }: any, ref: any) => (
    <div className="h-full w-full relative group">
        <textarea
            ref={ref}
            value={value}
            onChange={(e) => !readOnly && onChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            spellCheck={false}
            className={`w-full h-full bg-surface-dark text-text-primary font-mono text-sm p-4 resize-none outline-none border border-border rounded-md focus:border-primary ${readOnly ? 'cursor-text' : ''}`}
            style={{ tabSize: 2 }}
        />
        <div className="absolute top-2 right-2 text-xs text-text-secondary opacity-50 pointer-events-none uppercase bg-surface-dark px-2 rounded">
            {language}
        </div>
    </div>
));

export const Tabs = ({ activeTabId, onTabClick, children }: any) => (
    <div className="flex flex-col h-full">
        <div className="flex space-x-1 border-b border-border bg-surface px-2 pt-2">
            {React.Children.map(children, (child) => {
                if (!child) return null;
                const isActive = child.props.id === activeTabId;
                return (
                    <button
                        key={child.props.id}
                        onClick={() => !child.props.disabled && onTabClick(child.props.id)}
                        disabled={child.props.disabled}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                            isActive 
                            ? 'bg-background-light text-primary border-t border-x border-border' 
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                    >
                        {child.props.label}
                    </button>
                );
            })}
        </div>
        <div className="flex-grow bg-background-light p-4 overflow-hidden flex flex-col">
            {React.Children.map(children, (child) => {
                if (child.props.id !== activeTabId) return null;
                return <div className="h-full flex flex-col">{child.props.children}</div>;
            })}
        </div>
    </div>
);

export const TabPanel = ({ children }: any) => <>{children}</>;

export const ProgressBar = ({ progress, className }: any) => (
    <div className={`w-full bg-surface rounded-full h-2.5 dark:bg-gray-700 ${className}`}>
        <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
    </div>
);

export const Alert = ({ type, message, title, children, className = '' }: any) => {
    const types = {
        error: "bg-red-900/20 border-red-900 text-red-200",
        warning: "bg-yellow-900/20 border-yellow-900 text-yellow-200",
        info: "bg-blue-900/20 border-blue-900 text-blue-200",
        success: "bg-green-900/20 border-green-900 text-green-200"
    };
    return (
        <div className={`border p-4 rounded-md ${types[type as keyof typeof types]} ${className}`}>
            {(title || message) && (
                <div className="font-semibold flex items-center mb-1">
                    {type === 'error' && <XCircleIcon className="w-5 h-5 mr-2" />}
                    {type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5 mr-2" />}
                    {type === 'success' && <CheckCircleIcon className="w-5 h-5 mr-2" />}
                    {title || message}
                </div>
            )}
            {children}
        </div>
    );
};

export const Notification = ({ message, type }: any) => {
    const types = {
        info: "bg-blue-600",
        success: "bg-green-600",
        warning: "bg-yellow-600",
        error: "bg-red-600"
    };
    return (
        <div className={`${types[type as keyof typeof types]} text-white px-4 py-3 rounded shadow-lg flex items-center animate-fade-in-up`}>
            <span className="mr-2">
                 {type === 'success' && <CheckCircleIcon className="w-5 h-5" />}
                 {type === 'error' && <XCircleIcon className="w-5 h-5" />}
                 {type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5" />}
                 {type === 'info' && <InformationCircleIcon className="w-5 h-5" />}
            </span>
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};

export const MarkdownRenderer = ({ content }: { content: string }) => (
    <pre className="whitespace-pre-wrap font-mono text-sm text-text-primary">{content}</pre>
);
