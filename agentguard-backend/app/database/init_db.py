from datetime import datetime
from sqlalchemy.orm import Session
from app.database.connection import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.core.permissions import UserRole, UserStatus, PermissionType, AgentStatus, RiskLevel, PolicyType
from app.models.user import User
from app.models.agent import Agent
from app.models.tool import Tool
from app.models.permission import Permission, AgentPermission
from app.models.agent_tool import AgentTool
from app.models.policy import Policy
from app.core.logging import logger

def init_db(db: Session = None):
    Base.metadata.create_all(bind=engine)
    
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
        
    try:
        # 1. Permissions
        permission_defs = [
            (PermissionType.READ, "Read-only access to entity records"),
            (PermissionType.WRITE, "Ability to create or update entity records"),
            (PermissionType.DELETE, "Ability to permanently remove entity records"),
            (PermissionType.FINANCIAL, "Ability to issue refunds, process credits or authorize payments"),
            (PermissionType.EXTERNAL_COMMUNICATION, "Ability to send outbound emails, SMS, or webhook calls"),
            (PermissionType.SENSITIVE_DATA, "Ability to view or query PII or confidential fields"),
            (PermissionType.DATABASE_EXPORT, "Ability to perform bulk queries or data exports"),
            (PermissionType.FILE_MODIFICATION, "Ability to write or modify system/storage files"),
        ]
        
        perm_map = {}
        for p_name, p_desc in permission_defs:
            perm = db.query(Permission).filter(Permission.name == p_name).first()
            if not perm:
                perm = Permission(name=p_name, description=p_desc)
                db.add(perm)
                db.flush()
            perm_map[p_name] = perm
            
        # 2. Users
        admin_user = db.query(User).filter(User.email == "admin@agentguard.io").first()
        if not admin_user:
            admin_user = User(
                name="Security Operations Admin",
                email="admin@agentguard.io",
                password_hash=get_password_hash("Admin123!"),
                role=UserRole.SUPER_ADMIN,
                status=UserStatus.ACTIVE
            )
            db.add(admin_user)
            db.flush()

        analyst_user = db.query(User).filter(User.email == "analyst@agentguard.io").first()
        if not analyst_user:
            analyst_user = User(
                name="SOC Analyst Jane",
                email="analyst@agentguard.io",
                password_hash=get_password_hash("Analyst123!"),
                role=UserRole.SECURITY_ANALYST,
                status=UserStatus.ACTIVE
            )
            db.add(analyst_user)
            db.flush()

        # 3. Tools
        # Note: refund_customer requires approval dynamically through policy when exceeding limits
        tool_defs = [
            ("customer.read", "Retrieve customer profile and contact details", "API", "/tools/customer/read", RiskLevel.LOW, PermissionType.READ, False),
            ("ticket.create", "Create customer support tickets or update status", "API", "/tools/ticket/create", RiskLevel.LOW, PermissionType.WRITE, False),
            ("email.send", "Send external notification or support emails", "COMMUNICATION", "/tools/email/send", RiskLevel.MEDIUM, PermissionType.EXTERNAL_COMMUNICATION, False),
            ("refund_customer", "Process financial refund transaction to customer account", "FINANCIAL", "/tools/finance/refund", RiskLevel.HIGH, PermissionType.FINANCIAL, False),
            ("customer.delete", "Permanently delete customer record and all GDPR history", "DATABASE", "/tools/customer/delete", RiskLevel.CRITICAL, PermissionType.DELETE, True),
            ("database.export", "Export entire customer database or transaction records", "DATABASE", "/tools/database/export", RiskLevel.CRITICAL, PermissionType.DATABASE_EXPORT, True),
            ("notification.send", "Send internal IT notification alerts", "COMMUNICATION", "/tools/notification/send", RiskLevel.LOW, PermissionType.EXTERNAL_COMMUNICATION, False),
            ("device.read", "Inspect IT hardware and device network status", "SYSTEM", "/tools/device/read", RiskLevel.LOW, PermissionType.READ, False),
            ("employee.read", "Read employee directory and job title", "HR", "/tools/hr/employee/read", RiskLevel.LOW, PermissionType.READ, False),
            ("payroll.export", "Export employee payroll and salary history", "HR", "/tools/hr/payroll/export", RiskLevel.CRITICAL, PermissionType.DATABASE_EXPORT, True),
        ]
        
        tool_map = {}
        for name, desc, t_type, endpoint, r_lvl, req_p, req_app in tool_defs:
            tool = db.query(Tool).filter(Tool.name == name).first()
            if not tool:
                tool = Tool(
                    name=name,
                    description=desc,
                    tool_type=t_type,
                    endpoint=endpoint,
                    risk_level=r_lvl,
                    required_permission=req_p,
                    requires_approval=req_app,
                    enabled=True
                )
                db.add(tool)
                db.flush()
            else:
                tool.requires_approval = req_app
            tool_map[name] = tool

        # 4. Demo Agents
        finance_bot = db.query(Agent).filter(Agent.name == "FinanceBot").first()
        if not finance_bot:
            finance_bot = Agent(
                name="FinanceBot",
                description="Autonomous finance agent responsible for processing refunds and customer billing transactions",
                provider="OpenAI GPT-4",
                environment="Production",
                status=AgentStatus.ACTIVE,
                risk_level=RiskLevel.HIGH,
                security_score=78,
                owner_id=admin_user.id
            )
            db.add(finance_bot)
            db.flush()
            
            db.add(AgentTool(agent_id=finance_bot.id, tool_id=tool_map["customer.read"].id, permission_level="READ"))
            db.add(AgentTool(agent_id=finance_bot.id, tool_id=tool_map["refund_customer"].id, permission_level="FINANCIAL"))
            
            db.add(AgentPermission(agent_id=finance_bot.id, permission_id=perm_map[PermissionType.READ].id))
            db.add(AgentPermission(agent_id=finance_bot.id, permission_id=perm_map[PermissionType.FINANCIAL].id, max_amount=10000.0))

        support_bot = db.query(Agent).filter(Agent.name == "SupportBot").first()
        if not support_bot:
            support_bot = Agent(
                name="SupportBot",
                description="Frontline customer support agent resolving inquiries, tickets and notifications",
                provider="Anthropic Claude 3.5 Sonnet",
                environment="Production",
                status=AgentStatus.ACTIVE,
                risk_level=RiskLevel.LOW,
                security_score=94,
                owner_id=admin_user.id
            )
            db.add(support_bot)
            db.flush()
            
            db.add(AgentTool(agent_id=support_bot.id, tool_id=tool_map["customer.read"].id))
            db.add(AgentTool(agent_id=support_bot.id, tool_id=tool_map["ticket.create"].id))
            db.add(AgentTool(agent_id=support_bot.id, tool_id=tool_map["email.send"].id))
            
            db.add(AgentPermission(agent_id=support_bot.id, permission_id=perm_map[PermissionType.READ].id))
            db.add(AgentPermission(agent_id=support_bot.id, permission_id=perm_map[PermissionType.WRITE].id))
            db.add(AgentPermission(agent_id=support_bot.id, permission_id=perm_map[PermissionType.EXTERNAL_COMMUNICATION].id))

        hr_bot = db.query(Agent).filter(Agent.name == "HR Assistant").first()
        if not hr_bot:
            hr_bot = Agent(
                name="HR Assistant",
                description="Internal Human Resources bot answering employee policy queries and directory lookups",
                provider="OpenAI GPT-4o",
                environment="Staging",
                status=AgentStatus.ACTIVE,
                risk_level=RiskLevel.MEDIUM,
                security_score=91,
                owner_id=admin_user.id
            )
            db.add(hr_bot)
            db.flush()
            
            db.add(AgentTool(agent_id=hr_bot.id, tool_id=tool_map["employee.read"].id))
            db.add(AgentPermission(agent_id=hr_bot.id, permission_id=perm_map[PermissionType.READ].id))

        it_bot = db.query(Agent).filter(Agent.name == "IT Support Agent").first()
        if not it_bot:
            it_bot = Agent(
                name="IT Support Agent",
                description="Internal IT operations agent triaging hardware diagnostics and network alerts",
                provider="OpenAI GPT-4",
                environment="Production",
                status=AgentStatus.ACTIVE,
                risk_level=RiskLevel.LOW,
                security_score=96,
                owner_id=admin_user.id
            )
            db.add(it_bot)
            db.flush()
            
            db.add(AgentTool(agent_id=it_bot.id, tool_id=tool_map["ticket.create"].id))
            db.add(AgentTool(agent_id=it_bot.id, tool_id=tool_map["device.read"].id))
            db.add(AgentTool(agent_id=it_bot.id, tool_id=tool_map["notification.send"].id))
            
            db.add(AgentPermission(agent_id=it_bot.id, permission_id=perm_map[PermissionType.READ].id))
            db.add(AgentPermission(agent_id=it_bot.id, permission_id=perm_map[PermissionType.WRITE].id))
            db.add(AgentPermission(agent_id=it_bot.id, permission_id=perm_map[PermissionType.EXTERNAL_COMMUNICATION].id))

        # 5. Core Policies
        policy_defs = [
            (
                "Financial Limit Policy - Max ₹10,000",
                "Requires human approval and blocks any refund exceeding ₹10,000 without authorized override",
                PolicyType.FINANCIAL_LIMIT,
                {"action": "refund_customer", "field": "amount", "operator": "gt", "value": 10000.0, "enforce": "REQUIRE_APPROVAL"},
                RiskLevel.HIGH
            ),
            (
                "Strict Data Deletion Prevention",
                "Blocks automated agents from performing unverified customer or record delete operations",
                PolicyType.DELETE_OPERATION,
                {"action": "customer.delete", "block_all": True, "enforce": "BLOCK"},
                RiskLevel.CRITICAL
            ),
            (
                "Database Bulk Export Guard",
                "Prevents unauthorized model tool requests from exporting bulk customer or payroll databases",
                PolicyType.DATA_ACCESS,
                {"actions": ["database.export", "payroll.export"], "enforce": "BLOCK"},
                RiskLevel.CRITICAL
            ),
            (
                "Sensitive API Key & Secret DLP Guard",
                "Scans payload parameters for raw bearer tokens, private keys, or credentials and blocks transmission",
                PolicyType.SENSITIVE_DATA,
                {"detect": ["API_KEY", "JWT_TOKEN", "PASSWORD", "CREDIT_CARD"], "enforce": "BLOCK"},
                RiskLevel.HIGH
            ),
            (
                "Outbound Communication Rate Limiter",
                "Enforces a maximum of 30 external messages or emails per minute per agent",
                PolicyType.RATE_LIMIT,
                {"action": "email.send", "limit_per_minute": 30, "enforce": "BLOCK"},
                RiskLevel.MEDIUM
            ),
        ]
        
        for name, desc, p_type, rule_def, sev in policy_defs:
            p = db.query(Policy).filter(Policy.name == name).first()
            if not p:
                p = Policy(
                    name=name,
                    description=desc,
                    policy_type=p_type,
                    rule_definition=rule_def,
                    severity=sev,
                    enabled=True,
                    created_by=admin_user.id
                )
                db.add(p)

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error during database initialization: {e}")
        raise e
    finally:
        if should_close:
            db.close()
