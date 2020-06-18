type SubscriberBody = {
  host: string;
  port: number;
  endpoint: string;
  method?: string;
  prod?: string;
  type?: string;
};

export default SubscriberBody;
