import os
import random
import time
import hmac
import hashlib
import webbrowser
from threading import Timer
from datetime import date
from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
from db import get_db_connection
import smtplib
from email.message import EmailMessage
import requests

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "change_this_to_a_secure_value")
CORS(app)

otp_store = {}

# Razorpay config
RAZORPAY_KEY_ID = "rzp_test_StaoDM4AGiTAij"
RAZORPAY_KEY_SECRET = "LF3QXEioo6PDuJ4aFrjZx7kl"
DEMO_MODE = False  # Enable demo/sandbox mode

# ================= SMTP CONFIG =================
SMTP_EMAIL = "support@corede.co"   # ✅ change this
SMTP_PASSWORD = "sfehrgbusnpbcplf"    # ✅ change this
ADMIN_EMAIL = "support@corede.co"  # ✅ HR email


# ================= REGISTRATION EMAIL =================
def send_registration_email(name, to_email, service):

    msg = EmailMessage()
    msg["Subject"] = "Registration Successful"
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email

    msg.set_content(f"""
Hello {name},

We are happy to inform you that your registration has been completed successfully. 🎉

Thank you for taking the time to connect with CoreDe Innovation. We have received your details and our team has been notified about your request. One of our representatives will review your requirements and get in touch with you shortly to discuss the next steps.

At CoreDe Innovation, we are committed to delivering high-quality digital solutions tailored to your business needs. Whether it is web development, digital marketing, SEO, or any other service, we aim to provide reliable support and innovative solutions to help your business grow.

If you have any additional information to share or if you have further questions, feel free to reply to this email or contact us through our website. We will be happy to assist you.

Thank you once again for choosing CoreDe Innovation. We look forward to working with you and building a successful partnership.

Warm regards,  
CoreDe Innovation Team
""")

    admin_msg = EmailMessage()
    admin_msg["Subject"] = "New User Registration"
    admin_msg["From"] = SMTP_EMAIL
    admin_msg["To"] = ADMIN_EMAIL

    admin_msg.set_content(f"""
New Registration:

Name: {name}
Email: {to_email}
Service: {service}
""")

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.send_message(admin_msg)


# ================= CAREER EMAIL (IMPORTANT) =================
def send_career_email(name, email, phone, position, message_text, file):

    print("🚀 Sending email...")

    msg = EmailMessage()
    msg["Subject"] = f"New Job Application - {name}"
    msg["From"] = SMTP_EMAIL
    msg["To"] = ADMIN_EMAIL

    msg.set_content(f"""
Name: {name}
Email: {email}
Phone: {phone}
Position: {position}

Message:
{message_text}
""")

    if file:
        msg.add_attachment(
            file.read(),
            maintype='application',
            subtype='octet-stream',
            filename=file.filename
        )

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)

    print("✅ Email Sent")

# ================= QUOTE API =================
@app.route("/submit-quote", methods=["POST"])
def submit_quote():
    try:
        data = request.get_json()

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
    SELECT id
    FROM quotes
    WHERE email = %s
    OR mobile = %s
""", (
    data["email"],
    data["mobile"]
))
        if cursor.fetchone():
            return jsonify({"status": "exists", "message": "Email already registered"})

        cursor.execute("""
            INSERT INTO quotes (name, email, mobile, company, designation, service, message)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data["name"], data["email"], data["mobile"],
            data["company"], data["designation"],
            data["service"], data["message"]
        ))

        conn.commit()
        cursor.close()
        conn.close()

        send_registration_email(data["name"], data["email"], data["service"])

        return jsonify({"status": "success"})

    except Exception as e:
        print("DB ERROR:", e)
        return jsonify({"status": "error"})


# ================= LOGIN =================
@app.route("/login", methods=["POST"])
def login():

    first_name = request.form.get("first_name", "").strip()
    last_name = request.form.get("last_name", "").strip()
    email = request.form.get("gmail", "").strip()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT name, email
        FROM quotes
        WHERE email = %s
    """, (email,))

    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if user:

        db_name = user["name"].lower().strip()
        entered_name = f"{first_name} {last_name}".lower().strip()

        if db_name == entered_name:

            return jsonify({
                "status": "success",
                "name": user["name"]
            })

        else:

            return jsonify({
                "status": "invalid_name"
            })

    else:

        return jsonify({
            "status": "not_found"
        })


# ================= PAGES =================
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/career")
def career():
    return render_template("career.html")


# ================= APPLY (CAREER FORM) =================
@app.route('/apply', methods=['POST'])
def apply():
    try:
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        phone = request.form.get("phone", "").strip()
        position = request.form.get("position", "").strip()
        message_text = request.form.get("message", "").strip()
        file = request.files.get("resume")
        
        print("🔥 APPLY API HIT")
        print("Name:", name)
        print("Email:", email)
        print("File:", file)

        if not name or not email:
            return jsonify({"status": "error", "message": "Name and Email are required."}), 400

        send_career_email(name, email, phone, position, message_text, file)

        return jsonify({"status": "success", "message": "Application sent successfully."})

    except Exception as e:
        print("CAREER ERROR:", e)
        return jsonify({"status": "error", "message": "Error submitting application. Please check server logs."}), 500


# ================= CHAT =================
OLLAMA_URL = "http://localhost:11434/api/generate"

@app.route("/chat", methods=["POST"])
def chat():
    payload = request.get_json() or {}
    message = payload.get("message", "")

    try:
        response = requests.post(OLLAMA_URL, json={
            "model": "phi3",
            "prompt": message,
            "stream": False
        })
        data = response.json()
        return jsonify({"reply": data.get("response", "No reply")})

    except Exception as e:
        print("CHAT ERROR:", e)
        return jsonify({"reply": "Error"})
    
    
    
    # ================= internship =================
@app.route("/internship")
def internship():
    return render_template("internship.html", razorpay_key_id=RAZORPAY_KEY_ID)


# ================= OTP API =================
@app.route('/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.get_json() or {}
        mobile = str(data.get('mobile', '')).strip()

        if not mobile or len(mobile) != 10 or not mobile.isdigit():
            return jsonify({"status": "error", "message": "Invalid mobile number."}), 400

        otp = str(random.randint(100000, 999999))
        otp_store[mobile] = {
            "otp": otp,
            "expires_at": time.time() + 300
        }

        print(f"[OTP] Mobile: {mobile} OTP: {otp}")

        response_payload = {
            "status": "sent",
            "message": "OTP has been sent to your mobile number."
        }

        if app.debug or os.environ.get("DEV_OTP_VISIBLE", "true") == "true":
            response_payload["otp"] = otp

        # TODO: integrate a real SMS gateway provider here for production.
        return jsonify(response_payload)
    except Exception as e:
        print("SEND OTP ERROR:", e)
        return jsonify({"status": "error", "message": "Unable to send OTP."}), 500


@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.get_json() or {}
        mobile = str(data.get('mobile', '')).strip()
        otp = str(data.get('otp', '')).strip()

        if not mobile or not otp:
            return jsonify({"status": "error", "message": "Mobile and OTP are required."}), 400

        entry = otp_store.get(mobile)
        if not entry:
            return jsonify({"status": "error", "message": "OTP not found or expired."}), 400

        if time.time() > entry["expires_at"]:
            otp_store.pop(mobile, None)
            return jsonify({"status": "error", "message": "OTP has expired. Please request a new one."}), 400

        if entry["otp"] != otp:
            return jsonify({"status": "error", "message": "Invalid OTP. Please try again."}), 400

        otp_store.pop(mobile, None)
        return jsonify({"status": "success", "message": "OTP verified successfully."})
    except Exception as e:
        print("VERIFY OTP ERROR:", e)
        return jsonify({"status": "error", "message": "Unable to verify OTP."}), 500


@app.route('/verify-payment', methods=['POST'])
def verify_payment():
    try:
        data = request.get_json() or {}
        order_id = str(data.get('order_id', '')).strip()
        payment_id = str(data.get('payment_id', '')).strip()
        signature = str(data.get('signature', '')).strip()

        if not order_id or not payment_id or not signature:
            return jsonify({"status": "error", "message": "Missing payment verification data."}), 400

        # Demo mode: accept any signature
        if DEMO_MODE or RAZORPAY_KEY_ID == "rzp_test_your_key_id":
            print("⚠️  DEMO MODE: Accepting payment without signature verification")
            return jsonify({"status": "success", "message": "Payment verified successfully (demo mode)."})

        payload = f"{order_id}|{payment_id}".encode()
        generated_signature = hmac.new(RAZORPAY_KEY_SECRET.encode(), payload, hashlib.sha256).hexdigest()

        if generated_signature != signature:
            return jsonify({"status": "error", "message": "Payment signature verification failed."}), 400

        return jsonify({"status": "success", "message": "Payment verified successfully."})
    except Exception as e:
        print("VERIFY PAYMENT ERROR:", e)
        return jsonify({"status": "error", "message": "Unable to verify payment."}), 500


# ================= CREATE RAZORPAY ORDER =================
@app.route("/create-order", methods=["POST"])
def create_order():
    try:
        data = request.get_json()
        amount = data.get("amount", 10000)  # Amount in paisa (100 = 1 INR)
        
        # Demo mode: return a fake order for testing
        if DEMO_MODE or RAZORPAY_KEY_ID == "rzp_test_your_key_id":
            print("⚠️  DEMO MODE: Using fake Razorpay order")
            return jsonify({
                "id": f"order_{int(time.time())}",
                "amount": amount,
                "currency": "INR"
            })
        
        receipt_value = data.get('receipt') or f"receipt_{data.get('email', 'unknown')}"
        order_response = requests.post(
            "https://api.razorpay.com/v1/orders",
            auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
            json={
                "amount": amount,
                "currency": "INR",
                "receipt": receipt_value
            }
        )
        
        print("Razorpay create-order status:", order_response.status_code)
        print("Razorpay create-order response:", order_response.text)

        if order_response.status_code == 200:
            order = order_response.json()
            return jsonify({
                "id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"]
            })
        else:
            return jsonify({"error": "Failed to create order", "details": order_response.text}), 500
    except Exception as e:
        print("RAZORPAY ERROR:", e)
        return jsonify({"error": "Failed to create order"}), 500
    
@app.route("/save-internship", methods=["POST"])
def save_internship():

    data = request.get_json()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO internship_applications
        (
            full_name,
            email,
            mobile,
            internship_role,
            internship_mode,
            internship_duration,
            package_type,
            razorpay_order_id,
            razorpay_payment_id,
            payment_status,
            amount
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (

        data["full_name"],
        data["email"],
        data["mobile"],
        data["internship_role"],
        data.get("internship_mode", "Online"),
        data.get("internship_duration", "3 Months"),
        data.get("package_type", "Standard"),
        data.get("razorpay_order_id"),
        data.get("razorpay_payment_id"),
        "SUCCESS",
        data.get("amount", 0)

    ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "status":"success"
    })

@app.route("/save-workshop", methods=["POST"])
def save_workshop():

    try:

        data = request.get_json() or {}

        # ================= USER DATA =================

        name = data.get("name")
        phone = data.get("phone")
        email = data.get("email")

        mode = data.get("mode")

        category = data.get("category")

        workshop_type = data.get("type")

        date_value = data.get("date")

        time_slot = data.get("time")

        hours = data.get("hours")

        amount = data.get("amount")

        order_id = data.get("order_id")

        payment_id = data.get("payment_id")

        # ================= DATABASE =================

        conn = get_db_connection()

        cursor = conn.cursor()

        # ================= INSERT =================

        # Adapt INSERT to match the actual table columns (no razorpay_order_id/payment_id columns)
        payment_status = "SUCCESS" if payment_id else "Pending"

        cursor.execute("""

            INSERT INTO workshop_booking(

                name,
                phone,
                email,
                workshop_mode,
                workshop_category,
                workshop_type,
                workshop_date,
                workshop_time,
                amount,
                payment_status

            )

            VALUES(

                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s

            )

        """, (

            name,
            phone,
            email,
            mode,
            category,
            workshop_type,
            date_value,
            time_slot,
            amount,
            payment_status

        ))

        # ================= SAVE =================

        conn.commit()

        cursor.close()

        conn.close()

        return jsonify({

            "status": "success",

            "message":
            "Workshop Saved Successfully"

        })

    except Exception as e:

        print("SAVE WORKSHOP ERROR:", e)

        return jsonify({

            "status": "error",

            "message": str(e)

        }), 500

@app.route("/privacy-policy")
def privacy_policy():
    return render_template("privacy-policy.html")


@app.route("/terms-and-conditions")
def terms():
    return render_template("terms-and-conditions.html")


@app.route("/refund-policy")
def refund():
    return render_template("refund-policy.html")


@app.route("/contact")
def contact():
    return render_template("contact.html") 


@app.route("/workshop")
@app.route("/workshop/")
def workshop():
    return render_template(
        "workshop.html",
        razorpay_key_id=RAZORPAY_KEY_ID,
        current_date=date.today().isoformat()
    )

@app.route("/book-workshop", methods=["POST"])
def book_workshop():

    try:

        data = request.get_json()

        # USER DATA

        name = data.get("name")
        phone = data.get("phone")
        email = data.get("email")

        mode = data.get("mode")
        workshop_type = data.get("type")

        date = data.get("date")
        time_slot = data.get("time")

        # PRICE

        amount = 1499

        if mode == "Offline":
            amount = 2499

        # DATABASE CONNECTION

        conn = get_db_connection()

        cursor = conn.cursor()

        # INSERT QUERY

        cursor.execute("""

            INSERT INTO workshop_booking(

                name,
                phone,
                email,
                workshop_mode,
                workshop_type,
                workshop_date,
                workshop_time,
                amount,
                payment_status

            )

            VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s)

        """, (

            name,
            phone,
            email,
            mode,
            workshop_type,
            date,
            time_slot,
            amount,
            "Pending"

        ))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({

            "status":"success",

            "message":
            "Workshop Booked Successfully",

            "amount":amount
        })

    except Exception as e:

        print("WORKSHOP ERROR:", e)

        return jsonify({

            "status":"error",

            "message":str(e)
        })   

# ================= RUN =================
if __name__ == "__main__":
    url = "http://127.0.0.1:5000"
    Timer(1.0, lambda: webbrowser.open(url)).start()
    app.run(host="127.0.0.1", port=5000, debug=True)