# Noble Chain Design System

## Design Philosophy

### Visual Language
**Institutional Fintech Aesthetic**: Clean, professional, and trustworthy interface that conveys financial security and reliability. The design follows established fintech conventions while maintaining a distinctive, modern appearance.

### Color Palette
**Primary Colors**:
- **Pure White (#FFFFFF)**: Primary background, card backgrounds, text on black elements
- **Deep Black (#000000)**: Core cards, primary buttons, navigation elements, text on white backgrounds
- **Soft Gray (#F5F5F5)**: Secondary backgrounds, subtle dividers, inactive states
- **Medium Gray (#888888)**: Secondary text, placeholders, inactive icons
- **Light Gray (#E0E0E0)**: Borders, subtle separators, hover states

**Accent Colors** (Minimal Use):
- **Success Green (#10B981)**: Positive transactions, buy actions, confirmations
- **Alert Red (#EF4444)**: Negative transactions, sent payments, warnings
- **Neutral Blue (#3B82F6)**: System actions, information, admin functions
- **Warning Amber (#F59E0B)**: Caution states, pending transactions

### Typography
**Primary Font**: Inter (Sans-serif)
- **Display**: Inter Bold, 28-32px for main headings
- **Heading**: Inter Semibold, 20-24px for section titles
- **Body**: Inter Regular, 14-16px for primary content
- **Caption**: Inter Medium, 12-14px for labels and metadata
- **Button**: Inter Semibold, 14-16px for action text

**Font Hierarchy**:
- Portfolio balance: 32px Bold
- Card titles: 18px Semibold  
- Body text: 14px Regular
- Transaction details: 12px Medium

### Layout Principles
**Mobile-First Grid**: 16px base padding, 12px inner spacing
**Card Design**: 12-16px border radius, soft shadows (0 2px 8px rgba(0,0,0,0.1))
**Touch Targets**: Minimum 44px for all interactive elements
**Content Width**: Maximum 400px for mobile, centered alignment

## Visual Effects

### Used Libraries
- **Anime.js**: Smooth micro-interactions and state transitions
- **Typed.js**: Typewriter effect for security phrase display
- **Splitting.js**: Text animation effects for headings
- **ECharts.js**: Portfolio balance visualization and transaction charts
- **Pixi.js**: Subtle particle effects for success states

### Animation Principles
**Micro-interactions**: Subtle button press animations, card hover states
**Page Transitions**: Smooth slide transitions between dashboard sections
**Loading States**: Skeleton screens and progress indicators
**Success Feedback**: Gentle bounce animations for completed actions
**Error States**: Shake animations for validation errors

### Header Effects
**Clean Minimalism**: No gradients, no glassmorphism, pure white background with subtle shadow separation
**Content Focus**: Typography hierarchy and spacing create visual interest without decorative elements

### Card Effects
**Black Foundation Cards**: Deep black backgrounds with white text, 12px border radius
**Subtle Shadows**: Soft drop shadows for depth without distraction
**Hover States**: Slight scale transform (1.02x) with shadow increase

### Interactive Elements
**Primary Buttons**: Black background, white text, subtle press animation
**Secondary Buttons**: White background, black border, black text
**Icon States**: Smooth color transitions on interaction
**Form Fields**: Clean borders with focus state animations

## Styling Guidelines

### Component Library
**Cards**: Black background, white text, consistent padding, rounded corners
**Buttons**: Two variants (primary black, secondary white), consistent sizing
**Forms**: Clean input fields with clear labels and validation states
**Navigation**: Bottom-fixed mobile navigation with icon + label
**Modals**: Centered overlays with backdrop blur

### Spacing System
**Base Unit**: 8px
**Padding**: 16px (2 units) for containers, 12px (1.5 units) for cards
**Margins**: 24px (3 units) between sections, 12px (1.5 units) between elements
**Border Radius**: 12px (1.5 units) for cards, 8px (1 unit) for buttons

### Responsive Behavior
**Mobile-First**: All components designed for 375px width minimum
**Touch-Friendly**: 44px minimum touch targets
**Readable Text**: 14px minimum font size for body text
**Accessible Contrast**: 4.5:1 contrast ratio maintained throughout

## Brand Elements

### Iconography
**Style**: Outline icons, 24px standard size, consistent stroke width
**Color**: Black for primary actions, gray for secondary
**Usage**: Navigation, actions, status indicators

### Logo Treatment
**Noble Chain Wordmark**: Clean, modern typography
**Placement**: Top left of dashboard, consistent sizing
**Color**: Black on white background

### Visual Hierarchy
**Information Architecture**: Portfolio balance → Actions → Assets → History
**Content Priority**: Most important financial information prominently displayed
**Scanning Patterns**: F-pattern layout for easy mobile scanning

## Security Design Patterns

### Trust Indicators
**Security Messaging**: "Secured by your recovery phrase" prominently displayed
**Visual Cues**: Shield icons, lock symbols, verification checkmarks
**Color Coding**: Green for secure, red for warnings, blue for information

### Confirmation Flows
**Multi-Step Verification**: Clear progress indicators for security-critical actions
**Visual Confirmation**: Large, clear typography for transaction details
**Warning States**: Prominent red warnings for irreversible actions

### Data Display
**Sensitive Information**: Masked by default, reveal on interaction
**Balance Display**: Large, clear typography for primary balances
**Transaction Details**: Organized, scannable layout

This design system ensures Noble Chain maintains a professional, trustworthy appearance while providing an intuitive user experience that follows established fintech design patterns.