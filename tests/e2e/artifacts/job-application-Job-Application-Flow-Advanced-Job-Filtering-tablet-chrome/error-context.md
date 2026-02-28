# Page snapshot

```yaml
- generic [ref=e6]:
  - heading "Welcome Back" [level=2] [ref=e7]
  - paragraph [ref=e8]: Sign in to your account
  - alert [ref=e9]: Invalid email or password
  - generic [ref=e10]:
    - generic [ref=e11]:
      - generic [ref=e12]: Email Address
      - textbox "Email address" [ref=e13]:
        - /placeholder: you@example.com
        - text: jobseeker@talentsphere.test
    - generic [ref=e14]:
      - generic [ref=e15]: Password
      - textbox "Password" [ref=e16]:
        - /placeholder: ••••••••
        - text: TestPassword123!
    - button "Login" [ref=e17] [cursor=pointer]
  - link "Forgot your password?" [ref=e19] [cursor=pointer]:
    - /url: /forgot-password
  - paragraph [ref=e20]:
    - text: Don't have an account?
    - link "Sign up" [ref=e21] [cursor=pointer]:
      - /url: /register
```