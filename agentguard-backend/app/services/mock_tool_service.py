import uuid
import random
from typing import Dict, Any
from pydantic import BaseModel

class MockToolExecutionResult(BaseModel):
    success: bool
    tool_name: str
    action_name: str
    message: str
    data: Dict[str, Any]

class MockToolService:
    def execute_tool(self, tool_name: str, action_name: str, payload: Dict[str, Any]) -> MockToolExecutionResult:
        """
        Executes a safe mock implementation of an authorized tool action.
        Guarantees that no real destructive changes or third-party outbound calls occur.
        """
        tool_lower = tool_name.lower()
        
        # 1. Customer Read
        if "customer.read" in tool_lower:
            cust_id = payload.get("customer_id", random.randint(100, 999))
            return MockToolExecutionResult(
                success=True,
                tool_name=tool_name,
                action_name=action_name,
                message=f"Customer #{cust_id} record retrieved successfully.",
                data={
                    "customer_id": cust_id,
                    "name": "Sarah Jenkins",
                    "email": "sarah.jenkins@example-corp.com",
                    "account_tier": "ENTERPRISE",
                    "status": "ACTIVE",
                    "currency": "INR",
                    "balance": 142500.0,
                    "created_at": "2024-03-15T08:30:00Z"
                }
            )

        # 2. Ticket Create
        elif "ticket.create" in tool_lower:
            ticket_id = f"TICK-{random.randint(10000, 99999)}"
            return MockToolExecutionResult(
                success=True,
                tool_name=tool_name,
                action_name=action_name,
                message="Support ticket dispatched to customer queue.",
                data={
                    "ticket_id": ticket_id,
                    "title": payload.get("title", "Customer Inquiry via AI Agent"),
                    "priority": payload.get("priority", "NORMAL"),
                    "status": "OPEN",
                    "assigned_queue": "Tier-2 Support"
                }
            )

        # 3. Email Send
        elif "email.send" in tool_lower:
            msg_id = f"MSG-{uuid.uuid4().hex[:10].upper()}"
            recipient = payload.get("recipient", payload.get("email", "customer@example-corp.com"))
            return MockToolExecutionResult(
                success=True,
                tool_name=tool_name,
                action_name=action_name,
                message=f"Outbound notification dispatched to {recipient}.",
                data={
                    "message_id": msg_id,
                    "recipient": recipient,
                    "status": "DELIVERED",
                    "provider": "AgentGuard Mock SMTP Gateway"
                }
            )

        # 4. Refund Customer (Financial Action)
        elif "refund_customer" in tool_lower:
            refund_id = f"REF-{uuid.uuid4().hex[:8].upper()}"
            amount = payload.get("amount", payload.get("refund_amount", 0.0))
            cust_id = payload.get("customer_id", 381)
            return MockToolExecutionResult(
                success=True,
                tool_name=tool_name,
                action_name=action_name,
                message=f"Refund of ₹{amount:,.2f} successfully credited to Customer #{cust_id}.",
                data={
                    "refund_id": refund_id,
                    "transaction_id": f"TXN-{random.randint(100000, 999999)}",
                    "customer_id": cust_id,
                    "amount": amount,
                    "currency": "INR",
                    "status": "SETTLED",
                    "cleared_at": "2026-09-24T19:30:00Z"
                }
            )

        # 5. Customer Delete (Simulated Destructive)
        elif "customer.delete" in tool_lower:
            cust_id = payload.get("customer_id", 0)
            return MockToolExecutionResult(
                success=True,
                tool_name=tool_name,
                action_name=action_name,
                message=f"[SIMULATED] Customer #{cust_id} record safely flagged for purge.",
                data={
                    "customer_id": cust_id,
                    "simulation": True,
                    "audit_notice": "No production tables were affected."
                }
            )

        # 6. Database Export (Simulated Bulk Access)
        elif "database.export" in tool_lower or "payroll.export" in tool_lower:
            export_token = f"EXP-{uuid.uuid4().hex[:12].upper()}"
            return MockToolExecutionResult(
                success=True,
                tool_name=tool_name,
                action_name=action_name,
                message="[SIMULATED] Export stream generated securely.",
                data={
                    "export_token": export_token,
                    "rows_exported": 150,
                    "simulation": True
                }
            )

        # Generic Safe Default
        return MockToolExecutionResult(
            success=True,
            tool_name=tool_name,
            action_name=action_name,
            message=f"Mock action '{action_name}' executed safely.",
            data={"status": "SUCCESS", "payload_echo": payload}
        )

mock_tool_service = MockToolService()
