

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from db import get_db_connection
import smtplib
from email.message import EmailMessage
from db import get_db_connection




app = Flask(__name__)
CORS(app)

# 🔐 SMTP CONFIG (SENDER EMAIL ONLY)
SMTP_EMAIL = "support@corede.co"
SMTP_PASSWORD = "uooajmpuwlfvjkhd"


def send_registration_email(to_email):
    msg = EmailMessage()
    msg["Subject"] = "Registration Successful"
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email

    msg.set_content("""
Hello,

We are happy to inform you that your registration has been completed successfully. 🎉

Thank you for taking the time to connect with CoreDe Innovation. We have received your details and our team has been notified about your request. One of our representatives will review your requirements and get in touch with you shortly to discuss the next steps.

At CoreDe Innovation, we are committed to delivering high-quality digital solutions tailored to your business needs. Whether it is web development, digital marketing, SEO, or any other service, we aim to provide reliable support and innovative solutions to help your business grow.

If you have any additional information to share or if you have further questions, feel free to reply to this email or contact us through our website. We will be happy to assist you.

Thank you once again for choosing CoreDe Innovation. We look forward to working with you and building a successful partnership.

Warm regards,  
CoreDe Innovation Team
""")

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)


@app.route("/submit-quote", methods=["POST"])
def submit_quote():
    try:
        data = request.get_json()

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1️⃣ Check email already exists
        cursor.execute(
            "SELECT id FROM quotes WHERE email = %s",
            (data["email"],)
        )
        existing_user = cursor.fetchone()

        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({
                "status": "exists",
                "message": "Email already registered. Please login."
            }), 200

        # 2️⃣ Insert if new email
        cursor.execute("""
            INSERT INTO quotes
            (name, email, mobile, company, designation, service, message)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data["name"],
            data["email"],
            data["mobile"],
            data["company"],
            data["designation"],
            data["service"],
            data["message"]
        ))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Registration successful"
        }), 201

    except Exception as e:
        print("DB ERROR:", e)
        return jsonify({
            "status": "error",
            "message": "Database error"
        }), 500

# login popup #
@app.route("/login", methods=["POST"])
def login():
    try:
        email = request.form.get("gmail")

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check user exists
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if user:
            return jsonify({"status": "success"})
        else:
            return jsonify({"status": "not_found"})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"status": "error"})
    
    
    
    
    

@app.route("/")
def home():
    return render_template("index.html")




@app.route("/about")
def about():
    return render_template("about.html")



if __name__ == "__main__":
    app.run(debug=True)
