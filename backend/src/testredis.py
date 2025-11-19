import redis
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv("/venv/.env")

def verify_token_and_get_uid():
    """
    验证 token 并从 Redis 获取 uid
    """
    # 定义 token 变量
    token = "b3374ea0-cf60-40fe-b99d-1f14672507ad"
    
    # 拼接 Redis key
    redis_key = f"Sa-Token:login:token:{token}"
    
    try:
        # 连接 Redis
        redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST'),
            port=int(os.getenv('REDIS_PORT', 6380)),
            password=os.getenv('REDIS_PASSWORD'),
            decode_responses=True  # 自动解码为字符串
        )
        
        # 从 Redis 获取 uid
        uid = redis_client.get(redis_key)
        
        if uid:
            print(f"Token 验证成功!")
            print(f"Redis Key: {redis_key}")
            print(f"UID: {uid}")
            return uid
        else:
            print(f"Token 验证失败: 未找到对应的 UID")
            print(f"Redis Key: {redis_key}")
            return None
            
    except redis.ConnectionError as e:
        print(f"Redis 连接错误: {e}")
        return None
    except Exception as e:
        print(f"发生错误: {e}")
        return None
    finally:
        try:
            redis_client.close()
        except:
            pass

if __name__ == "__main__":
    # 测试函数
    verify_token_and_get_uid()
