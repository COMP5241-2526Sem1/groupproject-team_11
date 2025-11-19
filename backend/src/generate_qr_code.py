import qrcode

def generate_qr_code(url, output_file):
    """Generate a QR code for the given URL and save it as an image file."""
    try:
        # Create a QR code object
        qr = qrcode.QRCode(
            version=10,  # Controls the size of the QR Code
            error_correction=qrcode.constants.ERROR_CORRECT_L,  # Error correction level
            box_size=10,  # Size of each box in the QR code grid
            border=4,  # Thickness of the border (minimum is 4)
        )

        # Add the URL to the QR code
        qr.add_data(url)
        qr.make(fit=True)

        # Create an image of the QR code
        img = qr.make_image(fill_color="black", back_color="white")

        # Save the image to the specified file
        img.save(output_file)
        print(f"QR code generated and saved as {output_file}")
    except Exception as e:
        print(f"Error generating QR code: {e}")

def main():
    # Input URL from the user
    url = input("Enter the URL to generate a QR code: ")
    output_file = input("Enter the output file name (e.g., qr_code.png): ")

    # Generate the QR code
    generate_qr_code(url, output_file)

if __name__ == "__main__":
    main()