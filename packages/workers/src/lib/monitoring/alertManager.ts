import axios from "axios";
import { alertLogger } from "../logger";
import environment from "../../config/environment";
import { supabase, Tables } from "../../config/database";

interface AlertData {
  type: "estoque-zero" | "estoque-critico" | "sap-offline" | "queue-backlog";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

export class AlertManager {
  private slackWebhookUrl = environment.monitoring.slackWebhookUrl;
  private alertEmail = environment.monitoring.alertEmail;

  /**
   * Send alert to all configured channels
   */
  async sendAlert(alert: AlertData): Promise<void> {
    alertLogger.warn("Sending alert", alert);

    // Log alert to database
    await this.logAlert(alert);

    // Send to different channels based on severity
    const promises: Promise<void>[] = [];

    if (alert.severity === "CRITICAL" || alert.severity === "HIGH") {
      promises.push(this.sendSlackAlert(alert));
      promises.push(this.sendEmailAlert(alert));
    } else {
      promises.push(this.sendSlackAlert(alert));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: AlertData): Promise<void> {
    if (!this.slackWebhookUrl) {
      alertLogger.warn("Slack webhook URL not configured");
      return;
    }

    try {
      const color = this.getSeverityColor(alert.severity);
      const emoji = this.getSeverityEmoji(alert.severity);

      const payload = {
        username: "SaúdeNow Alerts",
        icon_emoji: ":warning:",
        attachments: [
          {
            color,
            title: `${emoji} ${alert.title}`,
            text: alert.message,
            fields: [
              {
                title: "Severity",
                value: alert.severity,
                short: true,
              },
              {
                title: "Type",
                value: alert.type,
                short: true,
              },
              {
                title: "Timestamp",
                value: new Date(alert.timestamp).toLocaleString("pt-BR"),
                short: true,
              },
            ],
            footer: "SaúdeNow Integration Hub",
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      if (alert.data) {
        payload.attachments[0].fields.push({
          title: "Details",
          value: `\`\`\`${JSON.stringify(alert.data, null, 2)}\`\`\``,
          short: false,
        });
      }

      await axios.post(this.slackWebhookUrl, payload, {
        timeout: 10000,
      });

      alertLogger.info("Slack alert sent successfully");
    } catch (error) {
      alertLogger.error("Failed to send Slack alert:", error);
    }
  }

  /**
   * Send email alert (placeholder - implement with your email service)
   */
  private async sendEmailAlert(alert: AlertData): Promise<void> {
    alertLogger.info("Email alert would be sent to:", this.alertEmail);

    // TODO: Implement email sending with your preferred service
    // Examples: SendGrid, AWS SES, Nodemailer, etc.

    const emailData = {
      to: this.alertEmail,
      subject: `🚨 ${alert.severity} Alert: ${alert.title}`,
      body: this.formatEmailBody(alert),
    };

    alertLogger.info("Email alert data prepared", emailData);
  }

  /**
   * Log alert to database for history tracking
   */
  private async logAlert(alert: AlertData): Promise<void> {
    try {
      await supabase.from(Tables.INTEGRATION_LOGS).insert({
        source: "alert-manager",
        entity_type: alert.type,
        status: "warning",
        details: {
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          data: alert.data,
        },
        created_at: alert.timestamp,
      });
    } catch (error) {
      alertLogger.error("Failed to log alert to database:", error);
    }
  }

  /**
   * Create stock alert
   */
  async createStockAlert(
    type: "estoque-zero" | "estoque-critico",
    produtoData: any,
  ): Promise<void> {
    const isZero = type === "estoque-zero";

    const alert: AlertData = {
      type,
      severity: isZero ? "CRITICAL" : "HIGH",
      title: isZero ? "🔴 ESTOQUE ZERADO" : "⚠️ ESTOQUE CRÍTICO",
      message: this.formatStockMessage(type, produtoData),
      data: produtoData,
      timestamp: new Date().toISOString(),
    };

    await this.sendAlert(alert);
  }

  /**
   * Create SAP offline alert
   */
  async createSapOfflineAlert(duration: number): Promise<void> {
    const alert: AlertData = {
      type: "sap-offline",
      severity: duration > 300000 ? "CRITICAL" : "HIGH", // 5 minutes
      title: "🔌 SAP API INDISPONÍVEL",
      message: `SAP API está offline há ${Math.round(duration / 1000)}s. Integrações podem estar atrasadas.`,
      data: { duration, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    };

    await this.sendAlert(alert);
  }

  /**
   * Create queue backlog alert
   */
  async createQueueBacklogAlert(
    queueName: string,
    backlog: number,
  ): Promise<void> {
    const alert: AlertData = {
      type: "queue-backlog",
      severity: backlog > 1000 ? "HIGH" : "MEDIUM",
      title: "📬 FILA COM ACÚMULO",
      message: `Fila ${queueName} com ${backlog} jobs pendentes. Processamento pode estar lento.`,
      data: { queueName, backlog, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    };

    await this.sendAlert(alert);
  }

  /**
   * Create health alert
   */
  async createHealthAlert(
    service: string,
    status: string,
    data?: any,
  ): Promise<void> {
    const alert: AlertData = {
      type: "sap-offline",
      severity: status === "unhealthy" ? "CRITICAL" : "HIGH",
      title: `🏥 ${service.toUpperCase()} HEALTH CHECK FAILED`,
      message: `Service ${service} reported status: ${status}`,
      data: { service, status, ...data },
      timestamp: new Date().toISOString(),
    };

    await this.sendAlert(alert);
  }

  /**
   * Create sync alert
   */
  async createSyncAlert(
    service: string,
    type: string,
    data?: any,
  ): Promise<void> {
    const alert: AlertData = {
      type: "queue-backlog",
      severity: type === "high_error_rate" ? "HIGH" : "MEDIUM",
      title: `🔄 SYNC ALERT: ${service.toUpperCase()}`,
      message: `Sync issue detected for ${service}: ${type}`,
      data: { service, alertType: type, ...data },
      timestamp: new Date().toISOString(),
    };

    await this.sendAlert(alert);
  }

  /**
   * Create queue failure alert
   */
  async createQueueFailureAlert(
    queueName: string,
    failedCount: number,
  ): Promise<void> {
    const alert: AlertData = {
      type: "queue-backlog",
      severity: failedCount > 100 ? "CRITICAL" : "HIGH",
      title: "❌ QUEUE FAILURES DETECTED",
      message: `Fila ${queueName} com ${failedCount} jobs falhados. Verificar logs.`,
      data: { queueName, failedCount, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    };

    await this.sendAlert(alert);
  }

  private formatStockMessage(type: string, produtoData: any): string {
    const { produto, sku, quantidade, deposito } = produtoData;

    if (type === "estoque-zero") {
      return (
        `🔴 PRODUTO SEM ESTOQUE!\n\n` +
        `• Produto: ${produto?.nome || "N/A"}\n` +
        `• SKU: ${sku}\n` +
        `• Depósito: ${deposito}\n` +
        `• Quantidade: ${quantidade}\n\n` +
        `⚠️ Vendas online podem ser afetadas!`
      );
    }

    return (
      `⚠️ ESTOQUE BAIXO!\n\n` +
      `• Produto: ${produto?.nome || "N/A"}\n` +
      `• SKU: ${sku}\n` +
      `• Quantidade: ${quantidade}\n` +
      `• Depósito: ${deposito}\n\n` +
      `📦 Considere reabastecer em breve.`
    );
  }

  private formatEmailBody(alert: AlertData): string {
    return `
      <h2>${alert.title}</h2>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Type:</strong> ${alert.type}</p>
      <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString("pt-BR")}</p>
      
      <h3>Message</h3>
      <p>${alert.message.replace(/\n/g, "<br>")}</p>
      
      ${
        alert.data
          ? `
        <h3>Details</h3>
        <pre>${JSON.stringify(alert.data, null, 2)}</pre>
      `
          : ""
      }
      
      <hr>
      <p><em>SaúdeNow Integration Hub - Automated Alert</em></p>
    `;
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case "CRITICAL":
        return "#dc3545"; // Red
      case "HIGH":
        return "#fd7e14"; // Orange
      case "MEDIUM":
        return "#ffc107"; // Yellow
      case "LOW":
        return "#28a745"; // Green
      default:
        return "#6c757d"; // Gray
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case "CRITICAL":
        return "🔴";
      case "HIGH":
        return "🟠";
      case "MEDIUM":
        return "🟡";
      case "LOW":
        return "🟢";
      default:
        return "⚪";
    }
  }
}

// Export singleton instance
export const alertManager = new AlertManager();
