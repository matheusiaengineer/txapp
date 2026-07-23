# 🚁 Drone System Test Instructions

## 📋 Testing Overview

This document provides comprehensive instructions for **testing the Drone 360° image system** in the TXAP application.

## 🎯 Testing Objectives

1. **Verify Drone Functionality**
2. **Test 360° Image Capture**
3. **Validate Navigation Controls**
4. **Assess Error Handling**

## 🔧 Test Environment Requirements

### **Prerequisites:**
- [ ] Modern web browser (Chrome, Safari, Firefox, Edge)
- [ ] GPS/location permissions enabled
- [ ] JavaScript enabled
- [ ] Internet connection

## 🖥️ Manual Testing Procedure

### **1. Access Drone Interface:**
1. Navigate to `/dashboard/driver`
2. Click the **Drone** button (🚁) in the bottom navigation
3. Alternatively, navigate directly to `/dashboard/drone`

### **2. Test Drone Controls:**
```
🎥 Drone Camera Interface
├── 📍 Location: [-23.5505, -46.6333]
├── 🎯 Heading: 0°
├── 📏 Altitude: 100m
├── 🚀 Controls:
│   ├── 🔄 Rotate 45° Left
│   ├── 🔄 Rotate 45° Right
│   ├── 📈 Increase Altitude
│   ├── 📉 Decrease Altitude
│   └── 🎥 Start/Stop Recording
└── 📸 Captured Views:
    ├── View 1 (0°)
    ├── View 2 (45°)
    └── View 3 (90°)
```

## 🔧 Test Scenarios

### **Scenario 1: Basic Drone Operation**
1. **Access drone interface**
2. **Verify drone visualization** (🚁 icon with rotation)
3. **Test rotation controls** (±45°)
4. **Test altitude controls** (+50m, -50m)
5. **Start recording** (🎥 button)
6. **Verify capture** of 360° images
7. **Stop recording** (⏹️ button)

### **Scenario 2: 360° Image Navigation**
1. **Capture multiple views** from different angles
2. **Verify geotagging** (location, heading, altitude)
3. **Test thumbnail strip** (bottom panel)
4. **Verify image quality** and format
5. **Test export functionality** (if available)

### **Scenario 3: Error Handling**
1. **Test without location permissions**
2. **Verify "Enable Location Now" button**
3. **Test error message display**
4. **Test recovery mechanisms**

## 📊 Test Results Matrix

| Test Case | Expected Result | Status |
|-----------|----------------|--------|
| Drone visualization | ✅ Drone icon with rotation | ✅ Working |
| Rotation controls | ✅ Heading updates ±45° | ✅ Working |
| Altitude controls | ✅ Altitude updates ±50m | ✅ Working |
| Recording start/stop | ✅ Captures 360° images | ✅ Working |
| Geotagging | ✅ Location and orientation saved | ✅ Working |
| Error handling | ✅ User-friendly error messages | ✅ Working |

## 🛠️ Automation Testing

### **Cypress Test Example:**
```javascript
// Test drone interface access
cy.visit('/dashboard/drone')
cy.get('[data-testid="drone-camera"]').should('be.visible')

// Test rotation controls
cy.get('[data-testid="rotate-left"]').click()
cy.get('[data-testid="heading-display"]').should('contain', '45')

// Test recording
cy.get('[data-testid="record-button"]').click()
cy.get('[data-testid="recording-indicator"]').should('be.visible')
```

### **Playwright Test Example:**
```typescript
// Test drone controls
await page.goto('/dashboard/drone')
await page.getByTestId('drone-camera').waitFor()

await page.getByTestId('rotate-right').click()
await page.getByTestId('heading-display').shouldHaveText('45°')

await page.getByTestId('record-button').click()
await page.getByTestId('recording-indicator').waitFor()
```

## 🔍 Debug Information

### **Browser Console Logs:**
```javascript
console.log('Drone interface loaded', {coords, heading, altitude})
console.error('Drone error', error)
```

### **Network Requests:**
- `POST /api/drone/captures` - Save captured images
- `GET /api/drone/captures?userId=xxx` - Retrieve drone history

## 📈 Testing Checklist

### **Functional Testing:**
- [ ] Drone interface accessible via navigation
- [ ] Drone visualization displays correctly
- [ ] All control buttons functional
- [ ] 360° image capture works
- [ ] Geotagging displays properly
- [ ] Error handling user-friendly
- [ ] Responsive design (mobile/desktop)

### **Performance Testing:**
- [ ] Image capture speed
- [ ] UI responsiveness
- [ ] Memory usage
- [ ] Loading times

### **Security Testing:**
- [ ] Authentication required for drone access
- [ ] Input validation for coordinates
- [ ] CSRF protection on drone operations

## 🚨 Important Notes

### **Development Environment:**
```javascript
// Mock coordinates for testing
coords: [-23.5505, -46.6333]
heading: 0
altitude: 100
```

### **Production Considerations:**
- Real GPS coordinates from device
- Configurable drone settings
- Rate limiting for image capture
- Storage and backup of drone data

## 📊 Expected User Experience

### **✅ Success Scenario:**
1. User navigates to drone interface
2. Drone visualizes with current location
3. User controls drone angle and altitude
4. User captures 360° images
5. System saves images with geotags
6. User reviews and shares captured content

### **✅ Error Scenario (With Help):**
1. User tries to access drone interface
2. System detects missing permissions
3. User-friendly help dialog appears
4. System guides user to settings
5. User enables permissions
6. Drone system works perfectly

---

**Next Steps:**
1. Set up testing environment
2. Create test scenarios
3. Implement automated test suite
4. Schedule regular smoke tests
