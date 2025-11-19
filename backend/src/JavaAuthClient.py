import requests
from typing import Dict, Any

"""
JavaAuthClient
Args:
    base_url: Java Service Base URL ("http://43.163.233.241:8081")
    timeout: 30s
"""
class JavaAuthClient:

    def __init__(self, base_url: str, timeout: int = 30):
        self.base_url = base_url
        self.timeout = timeout
        self.session = requests.Session()

    def _make_request(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        HTTP POST
        Args:
            endpoint: Such as "/account/login/email/psw"
            data:

        Returns:
            AjaxResult
        """
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}

        try:
            response = self.session.post(
                url,
                json=data,
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()

            return response.json() if response.content else {}

        except requests.exceptions.ConnectionError as e:
            return {
                "error": True,
                "message": f"无法连接到Java服务: {str(e)}",
                "type": "connection_error"
            }
        except requests.exceptions.Timeout as e:
            return {
                "error": True,
                "message": f"请求超时: {str(e)}",
                "type": "timeout_error"
            }
        except requests.exceptions.HTTPError as e:
            return {
                "error": True,
                "message": f"HTTP错误: {str(e)}",
                "status_code": e.response.status_code,
                "type": "http_error"
            }
        except Exception as e:
            return {
                "error": True,
                "message": f"请求异常: {str(e)}",
                "type": "unknown_error"
            }

    def test_connection(self) -> Dict[str, Any]:
        try:
            test_data = {"email": "test@test.com"}
            response = self.session.post(
                f"{self.base_url}/account/login/email/psw",
                json=test_data,
                timeout=10
            )
            return {
                "status": "success",
                "message": "Java服务连接正常",
                "status_code": response.status_code
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Java服务连接失败: {str(e)}"
            }

    # ==================== Register ====================
    def register_step1_check_email(self, email: str) -> Dict[str, Any]:
        data = {"email": email}
        return self._make_request("/account/register/email/checkEmail", data)

    def register_step2_captcha_verify(self, email: str, captcha: str) -> Dict[str, Any]:
        data = {"email": email, "captcha": captcha}
        return self._make_request("/account/register/email/captchaVerify", data)

    def register_step3_create_account(self, email: str, password: str) -> Dict[str, Any]:
        data = {"email": email, "password": password}
        return self._make_request("/account/register/email/creatAccount", data)

    # ==================== login ====================
    def login_by_email(self, email: str, password: str) -> Dict[str, Any]:
        data = {"email": email, "password": password}
        return self._make_request("/account/login/email/psw", data)

    def login_by_username(self, username: str, password: str) -> Dict[str, Any]:
        data = {"username": username, "password": password}
        return self._make_request("/account/login/username/psw", data)

    def login_by_username_or_email(self, user: str, password: str) -> Dict[str, Any]:
        data = {"user": user, "password": password}
        return self._make_request("/account/login/user/psw", data)

    # ==================== reset password ====================
    def reset_password_step1_check_email(self, email: str) -> Dict[str, Any]:
        data = {"email": email}
        return self._make_request("/account/resetPsw/email/checkEmail", data)

    def reset_password_step2_captcha_verify(self, email: str, captcha: str) -> Dict[str, Any]:
        data = {"email": email, "captcha": captcha}
        return self._make_request("/account/resetPsw/email/captchaVerify", data)

    def reset_password_step3_reset_password(self, email: str, new_password: str) -> Dict[str, Any]:
        data = {"email": email, "newPassword": new_password}
        return self._make_request("/account/resetPsw/email/resetPsw", data)