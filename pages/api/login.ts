export default function handler(req, res) {
    const { email, password } = req.body;
    if (email === 'admin@example.com' && password === 'password') {
        res.status(200).json({
            message: 'Login success'
        });
    } else {
        res.status(401).json({
            message: 'Invalid credentials'
        });
    }
}
