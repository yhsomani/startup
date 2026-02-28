# Page snapshot

```yaml
- generic [ref=e6]:
  - heading "Welcome Back" [level=2] [ref=e7]
  - paragraph [ref=e8]: Sign in to your account
  - generic [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e11]: Email Address
      - textbox "Email address" [ref=e12]:
        - /placeholder: you@example.com
        - text: jobseeker@talentsphere.test
    - generic [ref=e13]:
      - generic [ref=e14]: Password
      - textbox "Password" [active] [ref=e15]:
        - /placeholder: ••••••••
        - text: TestPassword123!
    - button "Login" [ref=e16] [cursor=pointer]
  - link "Forgot your password?" [ref=e18] [cursor=pointer]:
    - /url: /forgot-password
  - paragraph [ref=e19]:
    - text: Don't have an account?
    - link "Sign up" [ref=e20] [cursor=pointer]:
      - /url: /register
```