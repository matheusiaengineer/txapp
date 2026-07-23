# 🚀 TXAP Application - Login Testing Guide

## 📋 TL;DR: Quick Test Instructions

| Feature | Test Method | Expected Result |
|---------|-------------|-----------------|
| **Driver Login** | `driver@test.com` / `12345678` | ✅ Redirect to `/dashboard/driver` |
| **Passenger Login** | `passenger@test.com` / `12345678` | ✅ Redirect to `/dashboard/passenger` |
| **Company Login** | `company@test.com` / `12345678` | ✅ Redirect to `/dashboard/company` |

## 🔑 Authentication System Test Credentials

### **Valid Test Credentials**

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| 🚗 Driver | `driver@test.com` | `12345678` | `/dashboard/driver` |
| 🚕 Passenger | `passenger@test.com` | `12345678` | `/dashboard/passenger` |
| 🏢 Company | `company@test.com` | `12345678` | `/dashboard/company` |

**Note:** These credentials are for **testing/development purposes only**.

## 🧪 Testing Methods

### **1. Manual Testing (Recommended for Initial Setup)**

#### **Step-by-Step Login Test:**

1. **Navigate to Login Page**
   ```
   http://localhost:3000/auth/login
   ```

2. **Enter Test Credentials**
   ```
   Email: driver@test.com
   Password: 12345678
   ```

3. **Submit Form**
   - Click "Entrar" button
   - Wait for authentication

4. **Verify Redirect**
   - ✅ Should redirect to `/dashboard/driver`
   - ✅ Driver dashboard loads successfully

#### **Test Different User Types:**

| Test Type | Email | Password | Expected Dashboard |
|-----------|-------|----------|-------------------|
| Driver | `driver@test.com` | `12345678` | `/dashboard/driver` |
| Passenger | `passenger@test.com` | `12345678` | `/dashboard/passenger` |
| Company | `company@test.com` | `12345678` | `/dashboard/company` |

### **2. Automated Testing (Script-Based)**

#### **cURL Test Example:**
```bash
# Test Driver Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "driver@test.com", "password": "12345678"}'

# Test Passenger Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "passenger@test.com", "password": "12345678"}'

# Test Company Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "company@test.com", "password": "12345678"}'
```

#### **JavaScript/Fetch Test Example:**
```javascript
// Driver Login Test
async function testDriverLogin() {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'driver@test.com',
      password: '12345678'
    })
  })
  
  const data = await response.json()
  console.log('Driver Login Response:', data)
  return data
}

// Test all user types
testDriverLogin()
testPassengerLogin()
testCompanyLogin()
```

## 📊 Expected Results

### **✅ Success Cases:**

| Test Case | Endpoint | Body | Expected Response |
|-----------|----------|------|-------------------|
| Driver Login | `POST /api/auth/login` | `{email: 'driver@test.com', password: '12345678'}` | ✅ Status 200, redirect to `/dashboard/driver` |
| Passenger Login | `POST /api/auth/login` | `{email: 'passenger@test.com', password: '12345678'}` | ✅ Status 200, redirect to `/dashboard/passenger` |
| Company Login | `POST /api/auth/login` | `{email: 'company@test.com', password: '12345678'}` | ✅ Status 200, redirect to `/dashboard/company` |

### **❌ Error Cases:**

| Test Case | Endpoint | Body | Expected Response |
|-----------|----------|------|-------------------|
| Invalid Email | `POST /api/auth/login` | `{email: 'wrong@test.com', password: '12345678'}` | ❌ Status 400, error message |
| Invalid Password | `POST /api/auth/login` | `{email: 'driver@test.com', password: 'wrong'}` | ❌ Status 400, error message |
| Missing Fields | `POST /api/auth/login` | `{email: 'driver@test.com'}` | ❌ Status 400, error message |

## 🛠️ Setup Instructions

### **1. Environment Setup:**
```bash
# Navigate to project directory
cd /path/to/txap

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### **2. Database Setup:**
Ensure the following test users exist in your Supabase database:

```sql
-- Test Users Table: profiles
INSERT INTO profiles (id, email, role, full_name, account_type, phone, cpf, created_at, updated_at) VALUES
('uuid-driver-001', 'driver@test.com', 'driver', 'Motorista Teste', 'driver_car', '11999999999', '12345678901', NOW(), NOW()),
('uuid-passenger-001', 'passenger@test.com', 'passenger', 'Passageiro Teste', 'passenger', '11888888888', '12345678902', NOW(), NOW()),
('uuid-company-001', 'company@test.com', 'company', 'Empresa Teste', 'business', '11777777777', '12345678903', NOW(), NOW());

-- Test Users Table: driver_profiles
INSERT INTO driver_profiles (id, cpf, modalities, rating, status, current_live_status) VALUES
('uuid-driver-001', '12345678901', ARRAY['carro'], 5.00, 'approved', 'OFFLINE'),
('uuid-passenger-001', '12345678902', ARRAY[], 5.00, 'approved', 'OFFLINE'),
('uuid-company-001', '12345678903', ARRAY[], 5.00, 'approved', 'OFFLINE');
```

## 📈 Testing Checklist

### **✅ Must Test:**
- [ ] Driver login works correctly
- [ ] Passenger login works correctly
- [ ] Company login works correctly
- [ ] Invalid credentials return proper error
- [ ] Form validation works
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly

### **✅ Optional Tests:**
- [ ] Google OAuth login (if enabled)
- [ ] Remember me functionality
- [ ] Password reset flow
- [ ] Account lockout after failed attempts

## 🔍 Debugging Tips

### **Common Issues & Solutions:**

1. **Login Fails:**
   - ✅ Check if test users exist in database
   - ✅ Verify password matches
   - ✅ Check environment variables

2. **Dashboard Wrong:**
   - ✅ Verify role mapping in database
   - ✅ Check profile data
   - ✅ Verify frontend routing

3. **API Returns Error:**
   ```bash
   # Check server logs
   npm run dev
   # Look for [Login] in console output
   ```

### **Debug Commands:**
```bash
# Check if server is running
curl http://localhost:3000/api/health

# Test login endpoint directly
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"driver@test.com","password":"12345678"}' | jq
```

## 🚨 Security Considerations

### **Important:**
1. **Never commit real passwords** to version control
2. **Use environment variables** for test credentials
3. **Consider using a test database** separate from production
4. **Implement proper password hashing** in production

### **Recommended Setup:**
```bash
# Create .env.local for local development
cp .env.example .env.local

# Update with test credentials
# Or use environment variables in production
cat .env.local
# Output example:
# TEST_USER_EMAIL=driver@test.com
# TEST_USER_PASSWORD=12345678
```

## 📊 Test Report Template

```markdown
# Login System Test Report

## Date: YYYY-MM-DD
## Tester: [Your Name]

### ✅ Successful Tests:
- [ ] Driver login (driver@test.com)
- [ ] Passenger login (passenger@test.com)
- [ ] Company login (company@test.com)

### ❌ Failed Tests:
- [ ] Invalid credentials error handling
- [ ] Missing fields validation

### 📝 Notes:

### 🎯 Summary:
✅ All critical login tests passed
```

---

## 🚀 Next Steps

1. **Set up test environment**
2. **Create test credentials**
3. **Run basic login tests**
4. **Implement comprehensive test suite**
5. **Schedule regular testing**

**Your login system is now ready for comprehensive testing!** 🎉
