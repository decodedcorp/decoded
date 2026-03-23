#!/usr/bin/env python3
"""
gRPC 백엔드 서버 연결 테스트 스크립트
"""
import asyncio
import sys
from grpc import aio
from src.config._environment import Environment

async def test_grpc_connection():
    """백엔드 gRPC 서버 연결 테스트"""
    try:
        # 환경 변수 로드
        env = Environment.from_environ()
        host = env.grpc_backend_host
        port = env.grpc_backend_port
        address = f"{host}:{port}"
        
        print(f"Testing connection to backend gRPC server at {address}...")
        print(f"Host: {host}")
        print(f"Port: {port}")
        print("-" * 60)
        
        # gRPC 채널 생성
        channel = aio.insecure_channel(address)
        
        try:
            # 30초 타임아웃으로 연결 시도
            print("Attempting to connect (timeout: 30s)...")
            await asyncio.wait_for(
                channel.channel_ready(),
                timeout=30.0
            )
            print("✅ SUCCESS: Connected to backend gRPC server!")
            print(f"   Server is reachable at {address}")
            return True
            
        except asyncio.TimeoutError:
            print(f"❌ TIMEOUT: Failed to connect within 30 seconds")
            print(f"   Server at {address} may be:")
            print(f"   - Not running")
            print(f"   - Not accessible from this container")
            print(f"   - Blocked by firewall/network settings")
            return False
            
        except Exception as e:
            print(f"❌ ERROR: Connection failed: {e}")
            print(f"   Error type: {type(e).__name__}")
            return False
            
        finally:
            await channel.close()
            
    except Exception as e:
        print(f"❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_grpc_connection())
    sys.exit(0 if success else 1)
